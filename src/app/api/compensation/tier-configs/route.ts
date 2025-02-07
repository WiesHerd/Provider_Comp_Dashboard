import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/compensation/tier-configs - Get all tier configurations
export async function GET() {
  try {
    const configs = await prisma.TierConfig.findMany({
      include: {
        Tier: true,
        _count: {
          select: {
            Tier: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching tier configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier configurations' },
      { status: 500 }
    );
  }
}

// POST /api/compensation/tier-configs - Create a new tier configuration
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate the request body
    if (!data.name) {
      return NextResponse.json(
        { error: 'Invalid request body. Required field: name' },
        { status: 400 }
      );
    }

    // If this config is being set as default, unset any existing default
    if (data.isDefault) {
      await prisma.TierConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create the new tier configuration
    const config = await prisma.TierConfig.create({
      data: {
        name: data.name,
        description: data.description || '',
        thresholdType: data.thresholdType || 'WRVU',
        status: 'Active',
        effectiveDate: new Date(),
        isDefault: data.isDefault || false
      },
      include: {
        Tier: true
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error creating tier configuration:', error);
    return NextResponse.json(
      { error: 'Failed to create tier configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/compensation/tier-configs/[id] - Update a tier configuration
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;

    // If this config is being set as default, unset any existing default
    if (data.isDefault) {
      await prisma.TierConfig.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    // Get the current config for history tracking
    const currentConfig = await prisma.TierConfig.findUnique({
      where: { id }
    });

    if (!currentConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Update the configuration
    const config = await prisma.TierConfig.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        thresholdType: data.thresholdType,
        isDefault: data.isDefault,
        status: data.status
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating tier configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update tier configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/compensation/tier-configs/[id] - Delete a tier configuration
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;

    // Check if the configuration exists
    const config = await prisma.TierConfig.findUnique({
      where: { id }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Delete the configuration
    await prisma.TierConfig.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tier configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete tier configuration' },
      { status: 500 }
    );
  }
} 