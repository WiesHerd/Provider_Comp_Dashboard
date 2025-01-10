import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Get all metrics
    const metrics = await prisma.providerMetrics.findMany();

    // Update plan progress for each metric
    const updates = await Promise.all(metrics.map(async (metric) => {
      return prisma.providerMetrics.update({
        where: {
          providerId_year_month: {
            providerId: metric.providerId,
            year: metric.year,
            month: metric.month
          }
        },
        data: {
          planProgress: metric.cumulativeTarget > 0 ? 
            (metric.cumulativeWRVUs / metric.cumulativeTarget) * 100 : 0
        }
      });
    }));

    return NextResponse.json({
      success: true,
      updatedRecords: updates.length,
      message: 'Successfully updated plan progress for all metrics'
    });

  } catch (error) {
    console.error('Error updating plan progress:', error);
    return NextResponse.json(
      { error: 'Failed to update plan progress', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 