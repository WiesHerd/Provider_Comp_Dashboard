import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const marketData = await prisma.marketData.findMany();
    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
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
        p90_cf: data.p90_cf
      }
    });
    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error creating market data:', error);
    return NextResponse.json(
      { error: 'Failed to create market data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const marketData = await prisma.marketData.update({
      where: {
        id: data.id
      },
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
        p90_cf: data.p90_cf
      }
    });
    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error updating market data:', error);
    return NextResponse.json(
      { error: 'Failed to update market data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.marketData.delete({
      where: {
        id
      }
    });
    return NextResponse.json({ message: 'Market data deleted successfully' });
  } catch (error) {
    console.error('Error deleting market data:', error);
    return NextResponse.json(
      { error: 'Failed to delete market data' },
      { status: 500 }
    );
  }
} 