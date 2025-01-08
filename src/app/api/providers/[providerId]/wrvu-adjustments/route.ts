import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';

// GET endpoint to fetch all WRVU adjustments for a provider
export async function GET(
  request: Request,
  { params }: { params: { providerId: string } }
) {
  try {
    // Fetch all adjustments for the provider
    const adjustments = await prisma.wRVUAdjustment.findMany({
      where: {
        providerId: params.providerId,
      },
      orderBy: [
        { year: 'desc' },
        { name: 'asc' },
        { month: 'asc' }
      ],
    });

    // Group adjustments by name and year
    const groupedAdjustments = adjustments.reduce((acc, adj) => {
      const key = `${adj.name}-${adj.year}`;
      if (!acc[key]) {
        acc[key] = {
          id: adj.id,
          name: adj.name,
          description: adj.description,
          year: adj.year,
          providerId: adj.providerId,
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        };
      }
      // Map month number (1-12) to month name (jan-dec)
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthName = monthNames[adj.month - 1];
      acc[key][monthName] = adj.value;
      return acc;
    }, {});

    return NextResponse.json(Object.values(groupedAdjustments));
  } catch (error) {
    console.error("Error fetching WRVU adjustments:", error);
    return NextResponse.json(
      { error: "Error fetching WRVU adjustments" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new WRVU adjustment
export async function POST(
  request: Request,
  { params }: { params: { providerId: string } }
) {
  try {
    const data = await request.json();
    console.log('Received adjustment data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!data.year) {
      return NextResponse.json(
        { error: "Year is required" },
        { status: 400 }
      );
    }

    // Delete any existing adjustments with the same name and year
    await prisma.wRVUAdjustment.deleteMany({
      where: {
        name: data.name,
        providerId: params.providerId,
        year: data.year
      }
    });

    // Create new records for each non-zero month
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const adjustmentPromises = monthNames.map(async (monthName, index) => {
      const value = Number(data.monthlyValues?.[monthName] ?? 0);
      if (value === 0) return null;

      return prisma.wRVUAdjustment.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() ?? '',
          year: Number(data.year),
          month: index + 1,
          value,
          providerId: params.providerId
        }
      });
    });

    const createdAdjustments = (await Promise.all(adjustmentPromises)).filter(Boolean);

    // Create response object with all monthly values
    const response = {
      id: createdAdjustments[0]?.id || '',
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      year: data.year,
      providerId: params.providerId,
      ...monthNames.reduce((acc, month) => ({
        ...acc,
        [month]: Number(data.monthlyValues?.[month] ?? 0)
      }), {})
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating WRVU adjustment:", error);
    return NextResponse.json(
      { error: "Error creating WRVU adjustment" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a WRVU adjustment
export async function DELETE(
  request: Request,
  { params }: { params: { providerId: string } }
) {
  try {
    const { id } = await request.json();
    
    // Get the adjustment to find its name and year
    const adjustment = await prisma.wRVUAdjustment.findUnique({
      where: { id }
    });

    if (!adjustment) {
      return NextResponse.json(
        { error: "Adjustment not found" },
        { status: 404 }
      );
    }

    // Delete all records with the same name, provider, and year
    await prisma.wRVUAdjustment.deleteMany({
      where: {
        name: adjustment.name,
        providerId: params.providerId,
        year: adjustment.year
      },
    });

    return NextResponse.json({ message: "WRVU adjustment deleted successfully" });
  } catch (error) {
    console.error("Error deleting WRVU adjustment:", error);
    return NextResponse.json(
      { error: "Error deleting WRVU adjustment" },
      { status: 500 }
    );
  }
} 