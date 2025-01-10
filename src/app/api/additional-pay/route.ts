import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AdditionalPayFormData } from '@/types/additional-pay';
import { v4 as uuidv4 } from 'uuid';

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

    console.log('Received additional pay data:', {
      providerId,
      name,
      description,
      year,
      monthlyValues
    });

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!year || typeof year !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid year is required' },
        { status: 400 }
      );
    }

    // Generate a unique ID for this set of entries
    const groupId = uuidv4();

    // Create entries for each non-zero month
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const entries = months
      .map((month, index) => {
        const amount = parseFloat(String(monthlyValues[month])) || 0;
        return {
          id: `${groupId}_${index + 1}`,
          name: name.trim(),
          description: description?.trim() ?? '',
          providerId: String(providerId),
          year: Number(year),
          month: index + 1,
          amount,
          updatedAt: new Date()
        };
      });

    console.log('Prepared entries:', entries);

    // Create all entries in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('Starting transaction...');
      
      // Delete any existing entries with the same name, provider, and year
      await tx.additionalPay.deleteMany({
        where: {
          name: name.trim(),
          providerId: String(providerId),
          year: Number(year)
        }
      });

      // Create new entries
      const createdEntries = await Promise.all(
        entries.map(async (entry) => {
          try {
            const created = await tx.additionalPay.create({
              data: entry
            });
            console.log('Created entry:', created);
            return created;
          } catch (err) {
            console.error('Error creating entry:', err);
            throw err;
          }
        })
      );

      console.log('All entries created:', createdEntries);

      // Return the response data
      return {
        id: groupId,
        name: name.trim(),
        description: description?.trim() ?? '',
        year,
        providerId,
        type: 'additionalPay',
        ...months.reduce((acc, month, index) => ({
          ...acc,
          [month]: entries.find(e => e.month === index + 1)?.amount || 0
        }), {})
      };
    });

    console.log('Transaction completed successfully:', result);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating additional pay:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create additional pay', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 