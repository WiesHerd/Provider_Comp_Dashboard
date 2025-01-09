import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AdditionalPayFormData } from '@/types/additional-pay';

// GET /api/additional-pay
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

    const adjustments = await prisma.additionalPay.findMany({
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
          type: 'additionalPay',
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        };
      }
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      acc[curr.name][monthNames[curr.month - 1]] = curr.amount;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: Object.values(groupedAdjustments)
    });
  } catch (error) {
    console.error('Error fetching additional pay:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch additional pay' },
      { status: 500 }
    );
  }
}

// POST /api/additional-pay
export async function POST(request: Request) {
  try {
    const data = await request.json() as AdditionalPayFormData;
    const { providerId, name, description, year, monthlyValues } = data;

    // Create entries for each non-zero month
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const entries = months
      .map((month, index) => ({
        name,
        description,
        providerId,
        year,
        month: index + 1,
        amount: monthlyValues[month] || 0,
      }))
      .filter(entry => entry.amount !== 0);

    // Create all entries in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdEntries = await Promise.all(
        entries.map(entry => 
          tx.additionalPay.create({
            data: entry
          })
        )
      );

      // Return the first entry's ID and the monthly values
      return {
        id: createdEntries[0]?.id,
        name,
        description,
        year,
        providerId,
        type: 'additionalPay',
        ...months.reduce((acc, month, index) => ({
          ...acc,
          [month]: entries.find(e => e.month === index + 1)?.amount || 0
        }), {})
      };
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating additional pay:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create additional pay' },
      { status: 500 }
    );
  }
} 