import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TargetAdjustmentFormData } from '@/types/target-adjustment';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting target adjustment with ID:', params.id);

    // Check if the adjustment exists
    const existingAdjustment = await prisma.targetAdjustment.findUnique({
      where: { id: params.id }
    });

    if (!existingAdjustment) {
      console.log('Target adjustment not found:', params.id);
      return NextResponse.json(
        { success: false, error: 'Target adjustment not found' },
        { status: 404 }
      );
    }

    // Delete all records with the same name, provider, and year
    await prisma.targetAdjustment.deleteMany({
      where: {
        name: existingAdjustment.name,
        providerId: existingAdjustment.providerId,
        year: existingAdjustment.year
      }
    });

    console.log('Successfully deleted target adjustment:', params.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting target adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete target adjustment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data: TargetAdjustmentFormData = await request.json();
    console.log('Received target adjustment update data:', JSON.stringify(data, null, 2));

    // Get the existing adjustment
    const existingAdjustment = await prisma.targetAdjustment.findUnique({
      where: { id: params.id }
    });

    if (!existingAdjustment) {
      return NextResponse.json(
        { success: false, error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    // Delete all records with the same name, provider, and year
    await prisma.targetAdjustment.deleteMany({
      where: {
        name: existingAdjustment.name,
        providerId: existingAdjustment.providerId,
        year: existingAdjustment.year
      }
    });

    // Create new records for each non-zero month
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const adjustmentPromises = monthNames.map(async (monthName, index) => {
      const value = Number(data.monthlyValues?.[monthName] ?? 0);
      if (value === 0) return null;

      return prisma.targetAdjustment.create({
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

    const createdAdjustments = await Promise.all(adjustmentPromises);
    const validAdjustments = createdAdjustments.filter((adj): adj is NonNullable<typeof adj> => adj !== null);

    if (validAdjustments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No adjustments were created' },
        { status: 400 }
      );
    }

    // Convert the array of monthly records back to the expected format
    const monthlyValues = monthNames.reduce((acc, month, index) => {
      const adjustment = validAdjustments.find(adj => adj.month === index + 1);
      acc[month] = adjustment?.value ?? 0;
      return acc;
    }, {} as Record<string, number>);

    const firstAdjustment = validAdjustments[0];
    const response = {
      success: true,
      data: {
        id: firstAdjustment.id,
        name: firstAdjustment.name,
        description: firstAdjustment.description,
        year: firstAdjustment.year,
        providerId: firstAdjustment.providerId,
        ...monthlyValues
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating target adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update target adjustment' },
      { status: 500 }
    );
  }
} 