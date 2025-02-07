import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/compensation/tier-configs/[id] - Get a single tier configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = await params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const config = await prisma.tierConfig.findUnique({
      where: { id },
      include: {
        Tier: {
          orderBy: {
            wrvuThreshold: 'asc'
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

    // Transform the response to match the expected format
    const transformedConfig = {
      ...config,
      tiers: config.Tier
    };

    return NextResponse.json(transformedConfig);
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
    const id = await params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Get the current config for validation
    const currentConfig = await prisma.tierConfig.findUnique({
      where: { id }
    });

    if (!currentConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Update the configuration
    const config = await prisma.tierConfig.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        thresholdType: data.thresholdType,
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
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Check if the configuration exists
    const config = await prisma.tierConfig.findUnique({
      where: { id }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Delete the configuration
    await prisma.tierConfig.delete({
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