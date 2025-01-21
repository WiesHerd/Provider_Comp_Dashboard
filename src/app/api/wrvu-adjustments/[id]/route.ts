import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { WRVUAdjustmentFormData } from '@/types/wrvu-adjustment';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Updating wRVU adjustment with ID:', params.id);
    const data: WRVUAdjustmentFormData = await request.json();
    console.log('Received update data:', JSON.stringify(data, null, 2));

    // Check if the adjustment exists
    const existingAdjustment = await prisma.wRVUAdjustment.findUnique({
      where: { id: params.id }
    });

    if (!existingAdjustment) {
      console.log('wRVU adjustment not found:', params.id);
      return NextResponse.json(
        { success: false, error: 'wRVU adjustment not found' },
        { status: 404 }
      );
    }

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

    // Delete existing monthly records for this adjustment
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

    // Create the response object with all monthly values
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

    console.log('Successfully updated wRVU adjustment:', response);
    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error updating wRVU adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wRVU adjustment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting wRVU adjustment with ID:', params.id);

    // Check if the adjustment exists
    const existingAdjustment = await prisma.wRVUAdjustment.findUnique({
      where: { id: params.id }
    });

    if (!existingAdjustment) {
      console.log('wRVU adjustment not found:', params.id);
      return NextResponse.json(
        { success: false, error: 'wRVU adjustment not found' },
        { status: 404 }
      );
    }

    // Delete all adjustments with the same name, provider, and year
    await prisma.wRVUAdjustment.deleteMany({
      where: {
        name: existingAdjustment.name,
        providerId: existingAdjustment.providerId,
        year: existingAdjustment.year
      }
    });

    console.log('Successfully deleted wRVU adjustment:', params.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting wRVU adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete wRVU adjustment' },
      { status: 500 }
    );
  }
} 