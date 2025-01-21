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
    if (!data.effectiveDate || !data.newSalary || !data.newFTE || !data.previousConversionFactor || !data.newConversionFactor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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
        previousConversionFactor: data.previousConversionFactor,
        newConversionFactor: data.newConversionFactor,
        reason: data.reason
      }
    });

    // Update the provider's current values
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        baseSalary: data.newSalary,
        clinicalFte: data.newFTE,
        targetWRVUs: (data.newSalary / data.newConversionFactor) * data.newFTE
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
            targetWRVUs: (data.newSalary / data.newConversionFactor) * data.newFTE / 12,
            cumulativeTarget: ((data.newSalary / data.newConversionFactor) * data.newFTE / 12) * (i + 1),
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