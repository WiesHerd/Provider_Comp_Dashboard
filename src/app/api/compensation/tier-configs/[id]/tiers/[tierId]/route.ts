import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/compensation/tier-configs/[id]/tiers/[tierId] - Update a tier
export async function PUT(
  request: Request,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const data = await request.json();
    const { id, tierId } = params;

    // Update the tier
    const tier = await prisma.tierLevel.update({
      where: { id: tierId },
      data: {
        name: data.name,
        wrvuThreshold: data.wrvuThreshold,
        conversionFactor: data.conversionFactor
      }
    });

    return NextResponse.json(tier);
  } catch (error) {
    console.error('Error updating tier:', error);
    return NextResponse.json(
      { error: 'Failed to update tier' },
      { status: 500 }
    );
  }
}

// DELETE /api/compensation/tier-configs/[id]/tiers/[tierId] - Delete a tier
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const { id, tierId } = params;

    // Get the tier before deleting it
    const tier = await prisma.tierLevel.findUnique({
      where: { id: tierId }
    });

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    // Delete the tier
    await prisma.tierLevel.delete({
      where: { id: tierId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete tier' },
      { status: 500 }
    );
  }
} 