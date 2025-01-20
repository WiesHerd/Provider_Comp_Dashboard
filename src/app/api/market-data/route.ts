import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

// Helper function to generate a unique ID
const createId = () => randomUUID();

export async function GET() {
  try {
    const marketData = await prisma.$queryRaw`
      SELECT m.*, 
             CASE 
               WHEN h.marketDataId IS NOT NULL 
               THEN json_group_array(
                 json_object(
                   'changeType', h.changeType,
                   'fieldName', h.fieldName,
                   'oldValue', h.oldValue,
                   'newValue', h.newValue,
                   'changedAt', h.changedAt
                 )
               )
               ELSE '[]'
             END as history
      FROM market_data m
      LEFT JOIN MarketDataHistory h ON m.id = h.marketDataId
      GROUP BY m.id
    `;
    
    // Parse the JSON string in history field
    const formattedData = (marketData as any[]).map(item => ({
      ...item,
      history: JSON.parse(item.history || '[]')
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create the market data first
    const marketData = await prisma.marketData.create({
      data: data
    });

    // Then create the history record
    await prisma.$executeRaw`
      INSERT INTO MarketDataHistory (
        id,
        marketDataId,
        changeType,
        fieldName,
        newValue,
        changedAt
      ) VALUES (
        ${createId()},
        ${marketData.id},
        'CREATE',
        'all',
        ${JSON.stringify(data)},
        datetime('now')
      )
    `;

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error creating market data:', error);
    return NextResponse.json(
      { error: 'Failed to create market data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    // Get the current data before update
    const currentData = await prisma.marketData.findUnique({
      where: { id }
    });

    if (!currentData) {
      return NextResponse.json({ error: 'Market data not found' }, { status: 404 });
    }

    // Create history records for changed fields
    const changes = Object.entries(updateData)
      .filter(([key, value]) => currentData[key] !== value)
      .map(([key, value]) => ({
        id: createId(),
        marketDataId: id,
        changeType: 'UPDATE',
        fieldName: key,
        oldValue: String(currentData[key]),
        newValue: String(value),
        changedAt: new Date()
      }));

    // Update the market data
    const updatedData = await prisma.marketData.update({
      where: { id },
      data: updateData,
      include: {
        history: {
          orderBy: {
            changedAt: 'desc'
          },
          take: 10
        }
      }
    });

    // Insert history records if there are changes
    if (changes.length > 0) {
      await prisma.marketDataHistory.createMany({
        data: changes
      });
    }

    // Fetch the final data with history
    const finalData = await prisma.marketData.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: {
            changedAt: 'desc'
          },
          take: 10
        }
      }
    });

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('Error updating market data:', error);
    return NextResponse.json(
      { error: 'Failed to update market data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array is required' },
        { status: 400 }
      );
    }

    // Delete multiple records
    const result = await prisma.marketData.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      count: result.count
    });
  } catch (error) {
    console.error('Failed to delete market data:', error);
    return NextResponse.json(
      { error: 'Failed to delete market data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID is required for updates' },
        { status: 400 }
      );
    }

    const marketData = await prisma.marketData.update({
      where: {
        id: data.id
      },
      data: {
        specialty: data.specialty,
        p25_total: Number(data.p25_total) || 0,
        p50_total: Number(data.p50_total) || 0,
        p75_total: Number(data.p75_total) || 0,
        p90_total: Number(data.p90_total) || 0,
        p25_wrvu: Number(data.p25_wrvu) || 0,
        p50_wrvu: Number(data.p50_wrvu) || 0,
        p75_wrvu: Number(data.p75_wrvu) || 0,
        p90_wrvu: Number(data.p90_wrvu) || 0,
        p25_cf: Number(data.p25_cf) || 0,
        p50_cf: Number(data.p50_cf) || 0,
        p75_cf: Number(data.p75_cf) || 0,
        p90_cf: Number(data.p90_cf) || 0
      }
    });
    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error updating market data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update market data' },
      { status: 500 }
    );
  }
} 