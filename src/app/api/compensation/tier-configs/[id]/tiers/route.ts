import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/compensation/tier-configs/[id]/tiers - Create a new tier
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const configId = await params.id;

    // Validate the request body
    if (!data.name || typeof data.wrvuThreshold !== 'number' || typeof data.conversionFactor !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request body. Required fields: name, wrvuThreshold, conversionFactor' },
        { status: 400 }
      );
    }

    // Create the new tier
    const tier = await prisma.tier.create({
      data: {
        name: data.name,
        wrvuThreshold: data.wrvuThreshold,
        conversionFactor: data.conversionFactor,
        description: data.description,
        TierConfig: {
          connect: {
            id: configId
          }
        }
      }
    });

    // Add history entry
    await prisma.tierConfigHistory.create({
      data: {
        id: `${tier.id}_${Date.now()}`,
        configId: configId,
        changeType: 'CREATE',
        fieldName: 'tier',
        newValue: JSON.stringify(tier),
        changedBy: data.changedBy
      }
    });

    return NextResponse.json(tier);
  } catch (error) {
    console.error('Error creating tier:', error);
    return NextResponse.json(
      { error: 'Failed to create tier' },
      { status: 500 }
    );
  }
}

// PUT /api/compensation/tier-configs/[id]/tiers/[tierId] - Update a tier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const data = await request.json();
    const { id, tierId } = params;
    const configId = await id;

    // Validate the request body
    if (!data.name || typeof data.wrvuThreshold !== 'number' || typeof data.conversionFactor !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request body. Required fields: name, wrvuThreshold, conversionFactor' },
        { status: 400 }
      );
    }

    // Get the current tier data
    const currentTier = await prisma.tier.findUnique({
      where: { id: tierId }
    });

    if (!currentTier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    // Update the tier
    const tier = await prisma.tier.update({
      where: { id: tierId },
      data: {
        name: data.name,
        wrvuThreshold: Number(data.wrvuThreshold),
        conversionFactor: Number(data.conversionFactor),
        description: data.description,
        config: {
          connect: {
            id: configId
          }
        }
      }
    });

    // Add history entry
    await prisma.tierConfigHistory.create({
      data: {
        id: `${tier.id}_${Date.now()}`,
        configId: configId,
        changeType: 'UPDATE',
        fieldName: 'tier',
        oldValue: JSON.stringify(currentTier),
        newValue: JSON.stringify(tier),
        changedBy: data.changedBy || null
      }
    });

    return NextResponse.json(tier);
  } catch (error) {
    console.error('Error updating tier:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tier' },
      { status: 500 }
    );
  }
}

// DELETE /api/compensation/tier-configs/[id]/tiers/[tierId] - Delete a tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const { id, tierId } = params;
    const configId = await id;

    // Get the tier before deleting it
    const tier = await prisma.tier.findUnique({
      where: { id: tierId }
    });

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    // Delete the tier
    await prisma.tier.delete({
      where: { id: tierId }
    });

    // Add history entry
    await prisma.tierConfigHistory.create({
      data: {
        id: `${tier.id}_${Date.now()}`,
        configId: configId,
        changeType: 'DELETE',
        fieldName: 'tier',
        oldValue: JSON.stringify(tier),
        changedBy: null
      }
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