import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface MonthlyTarget {
  month: number;
  targetWRVUs: number;
  cumulativeTarget: number;
}

export async function POST(request: Request) {
  try {
    const { providerId, year, monthlyTargets } = await request.json() as {
      providerId: string;
      year: number;
      monthlyTargets: MonthlyTarget[];
    };

    // Validate input
    if (!providerId || !year || !monthlyTargets || !Array.isArray(monthlyTargets)) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Update metrics for each month
    const updates = await Promise.all(monthlyTargets.map(async (target) => {
      // Get existing metrics to calculate plan progress
      const existingMetrics = await prisma.providerMetrics.findUnique({
        where: {
          providerId_year_month: {
            providerId,
            year,
            month: target.month
          }
        }
      });

      return prisma.providerMetrics.upsert({
        where: {
          providerId_year_month: {
            providerId,
            year,
            month: target.month
          }
        },
        create: {
          providerId,
          year,
          month: target.month,
          targetWRVUs: target.targetWRVUs,
          cumulativeTarget: target.cumulativeTarget,
          // Set default values for required fields
          actualWRVUs: 0,
          rawMonthlyWRVUs: 0,
          cumulativeWRVUs: 0,
          baseSalary: 0,
          totalCompensation: 0,
          incentivesEarned: 0,
          holdbackAmount: 0,
          wrvuPercentile: 0,
          compPercentile: 0,
          planProgress: 0,
          monthsCompleted: 0
        },
        update: {
          targetWRVUs: target.targetWRVUs,
          cumulativeTarget: target.cumulativeTarget,
          planProgress: target.cumulativeTarget > 0 ? (existingMetrics?.cumulativeWRVUs || 0) / target.cumulativeTarget * 100 : 0
        }
      });
    }));

    return NextResponse.json({
      success: true,
      updates: updates.length
    });
  } catch (error) {
    console.error('Error in sync-targets:', error);
    return NextResponse.json(
      { error: 'Failed to sync target wRVUs' },
      { status: 500 }
    );
  }
} 