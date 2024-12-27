import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET endpoint to fetch all WRVU adjustments for a provider
export async function GET(
  request: Request,
  { params }: { params: { providerId: string } }
) {
  try {
    const adjustments = await prisma.wRVUAdjustment.findMany({
      where: {
        providerId: params.providerId,
      },
      orderBy: {
        year: 'desc',
      },
    });

    return NextResponse.json(adjustments);
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
    
    const adjustment = await prisma.wRVUAdjustment.create({
      data: {
        providerId: params.providerId,
        name: data.name,
        description: data.description,
        year: data.year,
        jan: data.jan || 0,
        feb: data.feb || 0,
        mar: data.mar || 0,
        apr: data.apr || 0,
        may: data.may || 0,
        jun: data.jun || 0,
        jul: data.jul || 0,
        aug: data.aug || 0,
        sep: data.sep || 0,
        oct: data.oct || 0,
        nov: data.nov || 0,
        dec: data.dec || 0,
        type: data.type || 'adjustment',
        category: data.category || 'operational',
        status: data.status || 'active'
      },
    });

    return NextResponse.json(adjustment);
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
    
    await prisma.wRVUAdjustment.delete({
      where: {
        id: id,
        providerId: params.providerId,
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