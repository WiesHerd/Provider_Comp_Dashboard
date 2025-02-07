import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/providers/[providerId]/compensation-changes - Get compensation changes for a provider
export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const providerId = await params.providerId;
    const changes = await prisma.compensationChange.findMany({
      where: { providerId },
      orderBy: { effectiveDate: 'desc' }
    });
    return NextResponse.json(changes);
  } catch (error) {
    console.error('Error fetching compensation changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compensation changes' },
      { status: 500 }
    );
  }
}

// POST /api/providers/[providerId]/compensation-changes - Create a new compensation change
export async function POST(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const providerId = params.providerId;
    const data = await request.json();
    console.log('Received compensation change data:', data);

    // First, get the provider using employeeId
    const provider = await prisma.provider.findUnique({
      where: { employeeId: providerId }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    const baseRequiredFields = ['effectiveDate', 'newSalary', 'newFTE', 'reason'];
    const missingBaseFields = baseRequiredFields.filter(field => !data[field]);

    if (missingBaseFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingBaseFields.join(', ')} are required` },
        { status: 400 }
      );
    }

    // Additional validation based on compensation model
    if (data.compensationModel === 'Tiered CF') {
      if (!data.tieredCFConfigId) {
        return NextResponse.json(
          { error: 'Tier configuration is required for Tiered CF model' },
          { status: 400 }
        );
      }

      // Verify the tier config exists
      const tierConfig = await prisma.tierConfig.findUnique({
        where: { id: data.tieredCFConfigId },
        include: { Tier: true }
      });

      if (!tierConfig) {
        return NextResponse.json(
          { error: 'Tier configuration not found' },
          { status: 404 }
        );
      }
    }

    // Create the compensation change
    const change = await prisma.compensationChange.create({
      data: {
        providerId: provider.id,
        effectiveDate: new Date(data.effectiveDate),
        previousSalary: data.previousSalary,
        newSalary: data.newSalary,
        previousFTE: data.previousFTE,
        newFTE: data.newFTE,
        previousConversionFactor: data.previousConversionFactor || 0,
        newConversionFactor: data.newConversionFactor || 0,
        reason: data.reason,
        compensationModel: data.compensationModel,
        tieredCFConfigId: data.tieredCFConfigId
      }
    });

    // Update the provider's current values
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        baseSalary: data.newSalary,
        clinicalFte: data.newFTE,
        compensationModel: data.compensationModel,
        tieredCFConfigId: data.tieredCFConfigId,
        targetWRVUs: data.compensationModel === 'Tiered CF' 
          ? 0 // For tiered CF, target WRVUs are determined by tiers
          : (data.newSalary / data.newConversionFactor) * data.newFTE
      }
    });

    // Trigger metrics recalculation using relative URL
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/metrics/sync-provider-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId,
          year: currentYear,
          metrics: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            targetWRVUs: data.compensationModel === 'Tiered CF'
              ? 0 // For tiered CF, target WRVUs are determined by tiers
              : (data.newSalary / data.newConversionFactor) * data.newFTE / 12,
            cumulativeTarget: data.compensationModel === 'Tiered CF'
              ? 0 // For tiered CF, cumulative targets are determined by tiers
              : ((data.newSalary / data.newConversionFactor) * data.newFTE / 12) * (i + 1),
            actualWRVUs: 0,
            cumulativeWRVUs: 0,
            baseSalary: data.newSalary,
            totalCompensation: data.newSalary / 12,
            wrvuPercentile: 0,
            compPercentile: 0
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync metrics');
      }
    } catch (recalcError) {
      console.warn('Failed to trigger metrics recalculation:', recalcError);
      // Continue since the main compensation change was successful
    }

    console.log('Created compensation change:', change);
    return NextResponse.json(change);
  } catch (error) {
    console.error('Error creating compensation change:', error);
    return NextResponse.json(
      { error: 'Failed to create compensation change' },
      { status: 500 }
    );
  }
}

// DELETE /api/providers/[providerId]/compensation-changes - Delete a compensation change
export async function DELETE(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Compensation change ID is required' },
        { status: 400 }
      );
    }

    // Check if the compensation change exists
    const existingChange = await prisma.compensationChange.findUnique({
      where: { id }
    });

    if (!existingChange) {
      return NextResponse.json(
        { error: 'Compensation change not found' },
        { status: 404 }
      );
    }

    // Delete the compensation change
    await prisma.compensationChange.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting compensation change:', error);
    return NextResponse.json(
      { error: 'Failed to delete compensation change' },
      { status: 500 }
    );
  }
} 