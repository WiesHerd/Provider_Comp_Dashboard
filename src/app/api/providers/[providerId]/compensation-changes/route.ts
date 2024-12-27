import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/providers/[providerId]/compensation-changes - Get compensation changes for a provider
export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const providerId = params.providerId;
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

    // Validate required fields
    if (!data.effectiveDate || !data.newSalary || !data.newFTE || !data.previousConversionFactor || !data.newConversionFactor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const change = await prisma.compensationChange.create({
      data: {
        providerId,
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