import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TargetAdjustmentFormData } from '@/types/target-adjustment';

// GET /api/target-adjustments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const year = searchParams.get('year');

    if (!providerId || !year) {
      return NextResponse.json(
        { success: false, error: 'Provider ID and year are required' },
        { status: 400 }
      );
    }

    const adjustments = await prisma.targetAdjustment.findMany({
      where: {
        providerId: String(providerId),
        year: Number(year)
      },
      orderBy: {
        month: 'asc'
      }
    });

    // Group adjustments by name and convert to monthly format
    const groupedAdjustments = adjustments.reduce((acc, curr) => {
      if (!acc[curr.name]) {
        acc[curr.name] = {
          id: curr.id,
          name: curr.name,
          description: curr.description,
          year: curr.year,
          providerId: curr.providerId,
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        };
      }
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      acc[curr.name][monthNames[curr.month - 1]] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: Object.values(groupedAdjustments)
    });
  } catch (error) {
    console.error('Error fetching target adjustments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch target adjustments' },
      { status: 500 }
    );
  }
}

// POST /api/target-adjustments
export async function POST(request: Request) {
  try {
    const data: TargetAdjustmentFormData = await request.json();
    console.log('Received target adjustment data:', JSON.stringify(data, null, 2));

    // Create records for each non-zero month
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
    console.error('Error creating target adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create target adjustment' },
      { status: 500 }
    );
  }
}

// DELETE /api/target-adjustments/:id
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Adjustment ID is required' },
        { status: 400 }
      );
    }

    // Get the existing adjustment
    const existingAdjustment = await prisma.targetAdjustment.findUnique({
      where: { id }
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting target adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete target adjustment' },
      { status: 500 }
    );
  }
} 