import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { providerId, year, metrics } = data;

    if (!providerId || !year || !metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing metrics to preserve actual wRVU data
    const existingMetrics = await prisma.providerMetrics.findMany({
      where: {
        providerId,
        year
      }
    });

    const promises = metrics.map(async (metric) => {
      const {
        month,
        targetWRVUs,
        cumulativeTarget,
        actualWRVUs,
        cumulativeWRVUs,
        baseSalary,
        totalCompensation,
        wrvuPercentile,
        compPercentile
      } = metric;

      // Find existing metric for this month to preserve actual wRVU data
      const existingMetric = existingMetrics.find(m => m.month === month);

      const commonData = {
        targetWRVUs,
        cumulativeTarget,
        actualWRVUs: existingMetric?.actualWRVUs ?? actualWRVUs,
        cumulativeWRVUs: existingMetric?.cumulativeWRVUs ?? cumulativeWRVUs,
        baseSalary,
        totalCompensation,
        wrvuPercentile: existingMetric?.wrvuPercentile ?? wrvuPercentile,
        compPercentile: existingMetric?.compPercentile ?? compPercentile,
        planProgress: cumulativeTarget > 0 ? ((existingMetric?.cumulativeWRVUs ?? cumulativeWRVUs) / cumulativeTarget) * 100 : 0
      };

      return prisma.providerMetrics.upsert({
        where: {
          providerId_year_month: {
            providerId,
            year,
            month
          }
        },
        update: commonData,
        create: {
          ...commonData,
          providerId,
          year,
          month,
          rawMonthlyWRVUs: existingMetric?.rawMonthlyWRVUs ?? actualWRVUs,
          incentivesEarned: existingMetric?.incentivesEarned ?? 0,
          holdbackAmount: existingMetric?.holdbackAmount ?? 0,
          monthsCompleted: month
        }
      });
    });

    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      message: 'Successfully updated metrics for all months'
    });

  } catch (error) {
    console.error('Error syncing provider metrics:', error);
    return NextResponse.json(
      { error: 'Failed to sync metrics', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 