import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { providerId, year, wrvuPercentile, compPercentile } = data;

    if (!providerId || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update all months for the provider
    const updateResults = await prisma.providerMetrics.updateMany({
      where: {
        providerId: providerId,
        year: year
      },
      data: {
        wrvuPercentile: wrvuPercentile || 0,
        compPercentile: compPercentile || 0
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: updateResults.count,
      message: `Updated ${updateResults.count} records with wRVU percentile: ${wrvuPercentile}% and comp percentile: ${compPercentile}%`
    });

  } catch (error) {
    console.error('Error updating percentiles:', error);
    return NextResponse.json(
      { error: 'Failed to update percentiles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 