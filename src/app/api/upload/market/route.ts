import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MarketData } from '@/types/market-data';

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    // Validate the data
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of market data.' },
        { status: 400 }
      );
    }

    // Validate each record
    for (const record of data) {
      if (!record.specialty || 
          typeof record.p25_total !== 'number' ||
          typeof record.p50_total !== 'number' ||
          typeof record.p75_total !== 'number' ||
          typeof record.p90_total !== 'number' ||
          typeof record.p25_wrvu !== 'number' ||
          typeof record.p50_wrvu !== 'number' ||
          typeof record.p75_wrvu !== 'number' ||
          typeof record.p90_wrvu !== 'number' ||
          typeof record.p25_cf !== 'number' ||
          typeof record.p50_cf !== 'number' ||
          typeof record.p75_cf !== 'number' ||
          typeof record.p90_cf !== 'number') {
        return NextResponse.json(
          { error: `Invalid data format for specialty: ${record.specialty}` },
          { status: 400 }
        );
      }
    }

    // Use a transaction to ensure all operations succeed or none do
    await prisma.$transaction(async (tx) => {
      // Clear existing market data
      await tx.marketData.deleteMany();

      // Insert new market data
      await tx.marketData.createMany({
        data: data.map((record: MarketData) => ({
          specialty: record.specialty,
          p25_total: record.p25_total,
          p50_total: record.p50_total,
          p75_total: record.p75_total,
          p90_total: record.p90_total,
          p25_wrvu: record.p25_wrvu,
          p50_wrvu: record.p50_wrvu,
          p75_wrvu: record.p75_wrvu,
          p90_wrvu: record.p90_wrvu,
          p25_cf: record.p25_cf,
          p50_cf: record.p50_cf,
          p75_cf: record.p75_cf,
          p90_cf: record.p90_cf,
        }))
      });
    });

    return NextResponse.json({ 
      message: 'Market data uploaded successfully',
      count: data.length
    });
  } catch (error) {
    console.error('Error uploading market data:', error);
    return NextResponse.json(
      { error: 'Failed to upload market data' },
      { status: 500 }
    );
  }
} 