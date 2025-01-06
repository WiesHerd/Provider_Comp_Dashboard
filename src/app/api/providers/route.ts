import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Provider, ProviderMetrics } from '@prisma/client';

interface ProviderWithMetricsResponse extends Provider {
  actualWRVUs: number;
  rawMonthlyWRVUs: number;
  cumulativeWRVUs: number;
  targetWRVUs: number;
  cumulativeTarget: number;
  totalCompensation: number;
  incentivesEarned: number;
  holdbackAmount: number;
  wrvuPercentile: number;
  compPercentile: number;
  planProgress: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const department = searchParams.get('department');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const search = searchParams.get('search')?.toLowerCase();

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    // Build where clause for provider filtering
    const where: any = {
      status: 'Active'
    };

    if (specialty) {
      where.specialty = specialty;
    }

    if (department) {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get providers with their metrics and wRVU data for all months up to current month
    const providers = await prisma.provider.findMany({
      where,
      include: {
        metrics: {
          where: {
            year: currentYear,
            month: {
              lte: currentMonth
            }
          }
        },
        wrvuData: {
          where: {
            year: currentYear,
            month: {
              lte: currentMonth
            }
          }
        },
        targetAdjustments: {
          where: {
            year: currentYear,
            month: {
              lte: currentMonth
            }
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Process each provider
    const processedProviders = await Promise.all(
      providers.map(async (provider) => {
        // Get current month metrics
        const currentMonthMetrics = provider.metrics.find(m => m.month === currentMonth);
        
        // Calculate cumulative values
        const cumulativeWRVUs = provider.wrvuData.reduce((sum, data) => sum + data.value, 0);
        const monthlyTarget = provider.targetWRVUs / 12; // Monthly target
        const cumulativeTarget = monthlyTarget * currentMonth; // YTD target

        // Add adjustments to target
        const targetAdjustmentsTotal = provider.targetAdjustments.reduce(
          (sum, adj) => sum + adj.value,
          0
        );

        return {
          ...provider,
          actualWRVUs: currentMonthMetrics?.actualWRVUs ?? 0,
          rawMonthlyWRVUs: currentMonthMetrics?.rawMonthlyWRVUs ?? 0,
          cumulativeWRVUs,
          targetWRVUs: monthlyTarget + targetAdjustmentsTotal,
          cumulativeTarget: cumulativeTarget + targetAdjustmentsTotal,
          totalCompensation: currentMonthMetrics?.totalCompensation ?? 0,
          incentivesEarned: currentMonthMetrics?.incentivesEarned ?? 0,
          holdbackAmount: currentMonthMetrics?.holdbackAmount ?? 0,
          wrvuPercentile: currentMonthMetrics?.wrvuPercentile ?? 0,
          compPercentile: currentMonthMetrics?.compPercentile ?? 0,
          planProgress: monthlyTarget > 0 ? ((currentMonthMetrics?.actualWRVUs ?? 0) / monthlyTarget) * 100 : 0
        } as ProviderWithMetricsResponse;
      })
    );

    return NextResponse.json(processedProviders);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
} 