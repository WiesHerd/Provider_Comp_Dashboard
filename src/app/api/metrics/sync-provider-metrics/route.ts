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

      return prisma.providerMetrics.upsert({
        where: {
          providerId_year_month: {
            providerId,
            year,
            month
          }
        },
        update: {
          targetWRVUs,
          cumulativeTarget,
          actualWRVUs,
          cumulativeWRVUs,
          baseSalary,
          totalCompensation,
          wrvuPercentile,
          compPercentile,
          planProgress: cumulativeTarget > 0 ? (cumulativeWRVUs / cumulativeTarget) * 100 : 0
        },
        create: {
          providerId,
          year,
          month,
          targetWRVUs,
          cumulativeTarget,
          actualWRVUs,
          cumulativeWRVUs,
          baseSalary,
          totalCompensation,
          wrvuPercentile,
          compPercentile,
          rawMonthlyWRVUs: actualWRVUs,
          incentivesEarned: 0,
          holdbackAmount: 0,
          planProgress: 0,
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