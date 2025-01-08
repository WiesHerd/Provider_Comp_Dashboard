import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WRVUAdjustmentFormData } from '@/types/wrvu-adjustment';

// GET /api/wrvu-adjustments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const year = searchParams.get('year');

    const where = {
      ...(providerId && { providerId }),
      ...(year && { year: parseInt(year) })
    };

    const adjustments = await prisma.wRVUAdjustment.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { name: 'asc' },
        { month: 'asc' }
      ]
    });

    // Group adjustments by name and year
    const groupedAdjustments = adjustments.reduce((acc, adj) => {
      const key = `${adj.name}-${adj.providerId}-${adj.year}`;
      if (!acc[key]) {
        acc[key] = {
          id: adj.id,
          name: adj.name,
          description: adj.description,
          year: adj.year,
          providerId: adj.providerId,
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        };
      }
      // Map month number (1-12) to month name (jan-dec)
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthName = monthNames[adj.month - 1];
      acc[key][monthName] = adj.value;
      return acc;
    }, {});

    return NextResponse.json({ 
      success: true, 
      data: Object.values(groupedAdjustments) 
    });
  } catch (error) {
    console.error('Error fetching wRVU adjustments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wRVU adjustments' },
      { status: 500 }
    );
  }
}

// POST /api/wrvu-adjustments
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const data: WRVUAdjustmentFormData = await request.json();
    console.log('Received wRVU adjustment data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!data.providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!data.year || typeof data.year !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid year is required' },
        { status: 400 }
      );
    }

    // Delete any existing adjustments with the same name and year
    await prisma.wRVUAdjustment.deleteMany({
      where: {
        name: data.name,
        providerId: data.providerId,
        year: data.year
      }
    });

    // Create new records for each non-zero month
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const adjustmentPromises = monthNames.map(async (monthName, index) => {
      const value = Number(data.monthlyValues?.[monthName] ?? 0);
      if (value === 0) return null;

      return prisma.wRVUAdjustment.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() ?? '',
          year: Number(data.year),
          month: index + 1,
          value,
          providerId: String(data.providerId)
        }
      });
    });

    const createdAdjustments = (await Promise.all(adjustmentPromises)).filter(Boolean);

    // Create response object with all monthly values
    const response = {
      id: createdAdjustments[0]?.id || '',
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      year: data.year,
      providerId: data.providerId,
      ...monthNames.reduce((acc, month) => ({
        ...acc,
        [month]: Number(data.monthlyValues?.[month] ?? 0)
      }), {})
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error creating wRVU adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create wRVU adjustment' },
      { status: 500 }
    );
  }
}

// DELETE /api/wrvu-adjustments/:id
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    // Get the adjustment to find its name and year
    const adjustment = await prisma.wRVUAdjustment.findUnique({
      where: { id }
    });

    if (!adjustment) {
      return NextResponse.json(
        { success: false, error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    // Delete all records with the same name, provider, and year
    await prisma.wRVUAdjustment.deleteMany({
      where: {
        name: adjustment.name,
        providerId: adjustment.providerId,
        year: adjustment.year
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Adjustment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting wRVU adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete wRVU adjustment' },
      { status: 500 }
    );
  }
} 