import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { year, ...monthlyData } = data;

    // Get existing record to compare changes
    const existingRecord = await prisma.wRVUData.findUnique({
      where: {
        id: params.id
      }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'wRVU record not found' },
        { status: 404 }
      );
    }

    // Create history entries for changed values
    const historyEntries = Object.entries(monthlyData)
      .filter(([month, value]) => existingRecord[month] !== value)
      .map(([month, value]) => ({
        wrvuDataId: params.id,
        changeType: 'UPDATE',
        fieldName: month,
        oldValue: String(existingRecord[month]),
        newValue: String(value),
        changedAt: new Date(),
        changedBy: 'system'
      }));

    // Update record and create history entries in a transaction
    const result = await prisma.$transaction([
      prisma.wRVUData.update({
        where: { id: params.id },
        data: {
          ...monthlyData,
          year
        }
      }),
      ...historyEntries.map(entry => 
        prisma.wRVUHistory.create({
          data: entry
        })
      )
    ]);

    return NextResponse.json({
      data: result[0],
      history: result.slice(1)
    });
  } catch (error) {
    console.error('Error updating wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to update wRVU data' },
      { status: 500 }
    );
  }
} 