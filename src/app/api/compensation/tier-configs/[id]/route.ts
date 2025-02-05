import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/compensation/tier-configs/[id] - Get a single tier configuration
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const config = await prisma.tieredCFConfig.findUnique({
      where: { id },
      include: {
        tiers: true,
        _count: {
          select: {
            providers: true
          }
        }
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching tier configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/compensation/tier-configs/[id] - Update a tier configuration
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { id } = params;

    // If this config is being set as default, unset any existing default
    if (data.isDefault) {
      await prisma.tieredCFConfig.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    // Get the current config for history tracking
    const currentConfig = await prisma.tieredCFConfig.findUnique({
      where: { id }
    });

    if (!currentConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Update the configuration
    const config = await prisma.tieredCFConfig.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        thresholdType: data.thresholdType,
        isDefault: data.isDefault,
        status: data.status,
        history: {
          create: {
            changeType: 'UPDATE',
            fieldName: 'all',
            oldValue: JSON.stringify(currentConfig),
            newValue: JSON.stringify(data)
          }
        }
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
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if the configuration is in use
    const config = await prisma.tieredCFConfig.findUnique({
      where: { id },
      include: {
        providers: true
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    if (config.providers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete configuration that is in use by providers' },
        { status: 400 }
      );
    }

    // Delete the configuration
    await prisma.tieredCFConfig.delete({
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