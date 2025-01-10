import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { providerId, year, month, wrvuPercentile, compPercentile } = data;

    if (!providerId || !year || !month) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedMetrics = await prisma.providerMetrics.update({
      where: {
        providerId_year_month: {
          providerId,
          year,
          month
        }
      },
      data: {
        wrvuPercentile: wrvuPercentile || 0,
        compPercentile: compPercentile || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedMetrics
    });

  } catch (error) {
    console.error('Error updating percentiles:', error);
    return NextResponse.json(
      { error: 'Failed to update percentiles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 