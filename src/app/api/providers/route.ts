import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Provider } from '@prisma/client';

interface ProviderWithMetricsResponse extends Provider {
  actualWRVUs: number;
  rawMonthlyWRVUs: number;
  ytdWRVUs: number;
  targetWRVUs: number;
  ytdTargetWRVUs: number;
  totalCompensation: number;
  incentivesEarned: number;
  holdbackAmount: number;
  wrvuPercentile: number;
  compPercentile: number;
  planProgress: number;
  monthsCompleted: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const department = searchParams.get('department');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const refresh = searchParams.get('refresh') === 'true';

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const isYTD = month === 'YTD';

    // Build where clause for provider filtering
    const where: any = {
      status: 'Active',
      ...(specialty && { specialty }),
      ...(department && { department })
    };

    // Refresh metrics if requested
    if (refresh) {
      await fetch('http://localhost:3000/api/metrics/calculate-all', { method: 'POST' });
    }

    // Optimized single query with all necessary data
    const providers = await prisma.provider.findMany({
      where,
      include: {
        metrics: {
          where: {
            year: currentYear,
            month: currentMonth
          },
          select: {
            actualWRVUs: true,
            rawMonthlyWRVUs: true,
            ytdWRVUs: true,
            targetWRVUs: true,
            ytdTargetWRVUs: true,
            totalCompensation: true,
            incentivesEarned: true,
            holdbackAmount: true,
            wrvuPercentile: true,
            compPercentile: true,
            monthsCompleted: true
          }
        },
        targetAdjustments: {
          where: {
            year: currentYear,
            ...(isYTD ? {} : { month: currentMonth })
          },
          select: {
            value: true,
            month: true
          }
        }
      }
    });

    // Process providers in memory (more efficient than additional queries)
    const processedProviders: ProviderWithMetricsResponse[] = providers.map(provider => {
      const metrics = provider.metrics[0] || {
        actualWRVUs: 0,
        rawMonthlyWRVUs: 0,
        ytdWRVUs: 0,
        targetWRVUs: 0,
        ytdTargetWRVUs: 0,
        totalCompensation: 0,
        incentivesEarned: 0,
        holdbackAmount: 0,
        wrvuPercentile: 0,
        compPercentile: 0,
        monthsCompleted: currentMonth
      };

      const targetAdjustmentsTotal = provider.targetAdjustments.reduce((sum, adj) => {
        if (isYTD || adj.month === currentMonth) {
          return sum + (adj.value || 0);
        }
        return sum;
      }, 0);

      const targetWRVUs = metrics.targetWRVUs + (isYTD ? 0 : targetAdjustmentsTotal);
      const ytdTargetWRVUs = metrics.ytdTargetWRVUs + targetAdjustmentsTotal;
      const actualWRVUs = isYTD ? metrics.ytdWRVUs : metrics.actualWRVUs;

      return {
        ...provider,
        actualWRVUs,
        rawMonthlyWRVUs: metrics.rawMonthlyWRVUs,
        ytdWRVUs: metrics.ytdWRVUs,
        targetWRVUs,
        ytdTargetWRVUs,
        totalCompensation: metrics.totalCompensation,
        incentivesEarned: metrics.incentivesEarned,
        holdbackAmount: metrics.holdbackAmount,
        wrvuPercentile: metrics.wrvuPercentile,
        compPercentile: metrics.compPercentile,
        planProgress: ytdTargetWRVUs > 0 ? (metrics.ytdWRVUs / ytdTargetWRVUs) * 100 : 0,
        monthsCompleted: metrics.monthsCompleted
      };
    });

    return NextResponse.json(processedProviders);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
} 