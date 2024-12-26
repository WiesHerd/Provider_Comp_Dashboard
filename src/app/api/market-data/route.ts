import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const marketData = await prisma.marketData.findMany({
      orderBy: {
        specialty: 'asc'
      }
    });

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    await prisma.marketData.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({ message: 'Market data deleted successfully' });
  } catch (error) {
    console.error('Failed to delete market data:', error);
    return NextResponse.json(
      { error: 'Failed to delete market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

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

    const marketData = await prisma.marketData.create({
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

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Failed to create market data:', error);
    return NextResponse.json(
      { error: 'Failed to create market data' },
      { status: 500 }
    );
  }
} 