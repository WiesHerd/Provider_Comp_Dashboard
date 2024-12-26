import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { id } = params;

    // Validate the data
    if (!data.specialty || 
        typeof data.p25_total !== 'number' ||
        typeof data.p50_total !== 'number' ||
        typeof data.p75_total !== 'number' ||
        typeof data.p90_total !== 'number' ||
        typeof data.p25_wrvu !== 'number' ||
        typeof data.p50_wrvu !== 'number' ||
        typeof data.p75_wrvu !== 'number' ||
        typeof data.p90_wrvu !== 'number' ||
        typeof data.p25_cf !== 'number' ||
        typeof data.p50_cf !== 'number' ||
        typeof data.p75_cf !== 'number' ||
        typeof data.p90_cf !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    const updatedMarketData = await prisma.marketData.update({
      where: { id },
      data: {
        specialty: data.specialty,
        p25_total: data.p25_total,
        p50_total: data.p50_total,
        p75_total: data.p75_total,
        p90_total: data.p90_total,
        p25_wrvu: data.p25_wrvu,
        p50_wrvu: data.p50_wrvu,
        p75_wrvu: data.p75_wrvu,
        p90_wrvu: data.p90_wrvu,
        p25_cf: data.p25_cf,
        p50_cf: data.p50_cf,
        p75_cf: data.p75_cf,
        p90_cf: data.p90_cf,
      },
    });

    return NextResponse.json(updatedMarketData);
  } catch (error) {
    console.error('Failed to update market data:', error);
    return NextResponse.json(
      { error: 'Failed to update market data' },
      { status: 500 }
    );
  }
} 