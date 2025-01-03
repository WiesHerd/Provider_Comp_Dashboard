import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { id } = params;

    console.log('Received update request for ID:', id);
    console.log('Update data:', JSON.stringify(data, null, 2));

    // Check if record exists
    const existingData = await prisma.marketData.findUnique({
      where: { id }
    });

    if (!existingData) {
      console.log('Record not found for ID:', id);
      return NextResponse.json(
        { error: 'Market data not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!data.specialty) {
      console.log('Missing required field: specialty');
      return NextResponse.json(
        { error: 'Specialty is required' },
        { status: 400 }
      );
    }

    // Check if specialty already exists for different ID
    const duplicateSpecialty = await prisma.marketData.findFirst({
      where: {
        specialty: data.specialty,
        NOT: {
          id: id
        }
      }
    });

    if (duplicateSpecialty) {
      console.log('Duplicate specialty found:', data.specialty);
      return NextResponse.json(
        { error: 'A record for this specialty already exists' },
        { status: 409 }
      );
    }

    // Prepare the update data with proper number conversion
    const updateData = {
      specialty: data.specialty,
      p25_total: Number(data.p25_total) || 0,
      p50_total: Number(data.p50_total) || 0,
      p75_total: Number(data.p75_total) || 0,
      p90_total: Number(data.p90_total) || 0,
      p25_wrvu: Number(data.p25_wrvu) || 0,
      p50_wrvu: Number(data.p50_wrvu) || 0,
      p75_wrvu: Number(data.p75_wrvu) || 0,
      p90_wrvu: Number(data.p90_wrvu) || 0,
      p25_cf: Number(data.p25_cf) || 0,
      p50_cf: Number(data.p50_cf) || 0,
      p75_cf: Number(data.p75_cf) || 0,
      p90_cf: Number(data.p90_cf) || 0
    };

    console.log('Processed update data:', JSON.stringify(updateData, null, 2));

    // Update the record
    const updatedMarketData = await prisma.marketData.update({
      where: { id },
      data: updateData
    });

    console.log('Successfully updated record:', JSON.stringify(updatedMarketData, null, 2));
    return NextResponse.json(updatedMarketData);
  } catch (error) {
    console.error('Failed to update market data:', error);
    // Ensure we always return a proper JSON response
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update market data',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if the record exists
    const existingData = await prisma.marketData.findUnique({
      where: { id }
    });

    if (!existingData) {
      return NextResponse.json(
        { error: 'Market data not found' },
        { status: 404 }
      );
    }

    // Delete the record
    await prisma.marketData.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete market data:', error);
    return NextResponse.json(
      { error: 'Failed to delete market data' },
      { status: 500 }
    );
  }
} 