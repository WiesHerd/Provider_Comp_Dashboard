import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WRVUAdjustment, WRVUAdjustmentFormData } from '@/types/wrvu-adjustment';

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
      include: {
        provider: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: adjustments });
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
    console.log('1. Received wRVU adjustment data:', JSON.stringify(data, null, 2));

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

    // Verify providerId exists
    console.log('2. Looking for provider with ID:', data.providerId);
    const provider = await prisma.provider.findUnique({
      where: { id: data.providerId }
    });
    console.log('3. Found provider:', provider);

    if (!provider) {
      console.error('Provider not found:', data.providerId);
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Validate monthly values
    if (!data.monthlyValues || typeof data.monthlyValues !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Monthly values are required' },
        { status: 400 }
      );
    }

    // Create the adjustment data with explicit type casting
    const adjustmentData = {
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      year: Number(data.year),
      providerId: String(data.providerId),
      jan: Number(data.monthlyValues.jan ?? 0),
      feb: Number(data.monthlyValues.feb ?? 0),
      mar: Number(data.monthlyValues.mar ?? 0),
      apr: Number(data.monthlyValues.apr ?? 0),
      may: Number(data.monthlyValues.may ?? 0),
      jun: Number(data.monthlyValues.jun ?? 0),
      jul: Number(data.monthlyValues.jul ?? 0),
      aug: Number(data.monthlyValues.aug ?? 0),
      sep: Number(data.monthlyValues.sep ?? 0),
      oct: Number(data.monthlyValues.oct ?? 0),
      nov: Number(data.monthlyValues.nov ?? 0),
      dec: Number(data.monthlyValues.dec ?? 0)
    };
    
    console.log('4. Attempting to create adjustment with data:', JSON.stringify(adjustmentData, null, 2));

    try {
      // Create the adjustment with explicit type information
      const adjustment = await prisma.wRVUAdjustment.create({
        data: {
          name: adjustmentData.name,
          description: adjustmentData.description,
          year: adjustmentData.year,
          providerId: adjustmentData.providerId,
          jan: adjustmentData.jan,
          feb: adjustmentData.feb,
          mar: adjustmentData.mar,
          apr: adjustmentData.apr,
          may: adjustmentData.may,
          jun: adjustmentData.jun,
          jul: adjustmentData.jul,
          aug: adjustmentData.aug,
          sep: adjustmentData.sep,
          oct: adjustmentData.oct,
          nov: adjustmentData.nov,
          dec: adjustmentData.dec
        },
        include: {
          provider: {
            select: {
              employeeId: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log('5. Successfully created adjustment:', JSON.stringify(adjustment, null, 2));

      return NextResponse.json({ 
        success: true, 
        data: adjustment 
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save adjustment to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating wRVU adjustment:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT /api/wrvu-adjustments/:id
export async function PUT(request: Request) {
  try {
    const data: WRVUAdjustment = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing adjustment ID' },
        { status: 400 }
      );
    }

    const adjustment = await prisma.wRVUAdjustment.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: adjustment });
  } catch (error) {
    console.error('Error updating wRVU adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wRVU adjustment' },
      { status: 500 }
    );
  }
}

// DELETE /api/wrvu-adjustments/:id
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    await prisma.wRVUAdjustment.delete({
      where: { id }
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