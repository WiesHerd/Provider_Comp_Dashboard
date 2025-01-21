import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AdditionalPayFormData, MonthlyValues } from '@/types/additional-pay';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting additional pay with ID:', params.id);

    // Check if the adjustment exists
    const existingAdjustment = await prisma.additionalPay.findUnique({
      where: { id: params.id }
    });

    if (!existingAdjustment) {
      console.log('Additional pay not found:', params.id);
      return NextResponse.json(
        { success: false, error: 'Additional pay not found' },
        { status: 404 }
      );
    }

    // Delete all records with the same name, provider, and year
    await prisma.additionalPay.deleteMany({
      where: {
        name: existingAdjustment.name,
        providerId: existingAdjustment.providerId,
        year: existingAdjustment.year
      }
    });

    console.log('Successfully deleted additional pay:', params.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting additional pay:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete additional pay' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Updating additional pay with ID:', params.id);
    const data: AdditionalPayFormData = await request.json();
    console.log('Received update data:', JSON.stringify(data, null, 2));

    // Extract the base ID (remove the _1, _2, etc. suffix)
    const baseId = params.id.split('_')[0];
    console.log('Base ID:', baseId);

    // Check if any adjustment exists with this base ID
    const existingAdjustment = await prisma.additionalPay.findFirst({
      where: {
        id: {
          startsWith: baseId
        }
      }
    });

    if (!existingAdjustment) {
      console.log('Additional pay not found:', baseId);
      return NextResponse.json(
        { success: false, error: 'Additional pay not found' },
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

    // Delete all existing records with this base ID
    await prisma.additionalPay.deleteMany({
      where: {
        id: {
          startsWith: baseId
        }
      }
    });

    // Create new records for each month
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
    const adjustmentPromises = monthNames.map(async (monthName, index) => {
      const amount = parseFloat(String(data.monthlyValues[monthName])) || 0;
      return prisma.additionalPay.create({
        data: {
          id: `${baseId}_${index + 1}`,
          name: data.name.trim(),
          description: data.description?.trim() ?? '',
          year: Number(data.year),
          month: index + 1,
          amount,
          providerId: String(data.providerId),
          updatedAt: new Date()
        }
      });
    });

    const createdAdjustments = await Promise.all(adjustmentPromises);
    console.log('Created adjustments:', createdAdjustments);

    // Create response object with all monthly values
    const response = {
      id: baseId,
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      year: data.year,
      providerId: data.providerId,
      type: 'additionalPay',
      ...monthNames.reduce((acc, month) => ({
        ...acc,
        [month]: parseFloat(String(data.monthlyValues[month])) || 0
      }), {})
    };

    console.log('Successfully updated additional pay:', response);
    return NextResponse.json({ 
      success: true, 
      data: response 
    });
  } catch (error) {
    console.error('Error updating additional pay:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update additional pay'
      },
      { status: 500 }
    );
  }
} 