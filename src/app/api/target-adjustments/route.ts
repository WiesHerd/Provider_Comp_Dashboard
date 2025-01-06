import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TargetAdjustmentFormData } from '@/types/target-adjustment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const year = searchParams.get('year');

    const where = {
      ...(providerId && { providerId }),
      ...(year && { year: parseInt(year) })
    };

    const adjustments = await prisma.targetAdjustment.findMany({
      where,
      include: {
        provider: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: adjustments });
  } catch (error) {
    console.error('Error fetching target adjustments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch target adjustments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const data: TargetAdjustmentFormData = await request.json();
    console.log('1. Received target adjustment data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!data.providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!data.year || typeof data.year !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid year is required' },
        { status: 400 }
      );
    }

    // Verify providerId exists
    console.log('2. Looking for provider with ID:', data.providerId);
    const provider = await prisma.provider.findUnique({
      where: { id: data.providerId }
    });
    console.log('3. Found provider:', provider);

    if (!provider) {
      console.error('Provider not found:', data.providerId);
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Create adjustments for each month with a value
    const adjustments = await Promise.all(
      Object.entries(data.monthlyValues || {}).map(async ([month, value]) => {
        if (value && value !== 0) {
          return prisma.targetAdjustment.create({
            data: {
              name: data.name.trim(),
              description: data.description?.trim() ?? '',
              year: Number(data.year),
              month: Number(month),
              value: Number(value),
              providerId: String(data.providerId)
            },
            include: {
              provider: {
                select: {
                  employeeId: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          });
        }
      })
    );

    const validAdjustments = adjustments.filter(Boolean);

    console.log('4. Successfully created adjustments:', JSON.stringify(validAdjustments, null, 2));

    return NextResponse.json({ 
      success: true, 
      data: validAdjustments 
    });
  } catch (error) {
    console.error('Error creating target adjustment:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 