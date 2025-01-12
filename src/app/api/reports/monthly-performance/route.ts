import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Add CORS headers
    const headersList = headers();
    const origin = '*';  // For development, allow all origins

    // Required filters
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2024'); // Default to 2024
    const month = parseInt(searchParams.get('month') || '1');
    
    console.log('API Route - Fetching data for:', { year, month });

    // Get all active providers with their metrics
    const providers = await prisma.provider.findMany({
      where: {
        status: 'Active'
      },
      include: {
        metrics: {
          where: {
            year,
            month: {
              lte: month
            }
          }
        },
        AdditionalPay: {
          where: {
            year,
            month: {
              lte: month
            }
          }
        }
      }
    });

    const providerMetrics = await Promise.all(providers.map(async (provider) => {
      // Get market data for the provider's specialty
      const marketData = await prisma.marketData.findFirst({
        where: { specialty: provider.specialty }
      });

      // Calculate YTD values
      const ytdMetrics = provider.metrics.reduce((acc, metric) => {
        console.log(`Processing metric for ${provider.firstName} ${provider.lastName}:`, {
          month: metric.month,
          actualWRVUs: metric.actualWRVUs,
          targetWRVUs: metric.targetWRVUs,
          currentYtdTarget: acc.ytdTargetWRVUs
        });
        return {
          ytdWRVUs: acc.ytdWRVUs + (metric.actualWRVUs || 0),
          ytdIncentives: acc.ytdIncentives + (metric.incentivesEarned || 0),
          ytdTargetWRVUs: acc.ytdTargetWRVUs + (metric.targetWRVUs || 0)
        };
      }, { ytdWRVUs: 0, ytdIncentives: 0, ytdTargetWRVUs: 0 });

      console.log(`Final YTD values for ${provider.firstName} ${provider.lastName}:`, {
        ytdWRVUs: ytdMetrics.ytdWRVUs,
        ytdTargetWRVUs: ytdMetrics.ytdTargetWRVUs
      });

      // Calculate YTD additional pay
      const ytdAdditionalPay = provider.AdditionalPay.reduce((sum, pay) => 
        sum + (pay.amount || 0), 0);

      // Get current month's metrics
      const currentMetrics = provider.metrics.find(m => m.month === month);

      // Calculate total compensation
      const annualBaseSalary = provider.baseSalary || 0;
      const totalCompensation = annualBaseSalary + ytdMetrics.ytdIncentives + ytdAdditionalPay;

      return {
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        specialty: provider.specialty,
        department: provider.department,
        monthlyWRVUs: currentMetrics?.actualWRVUs || 0,
        targetWRVUs: currentMetrics?.targetWRVUs || 0,
        ytdWRVUs: ytdMetrics.ytdWRVUs,
        ytdTargetWRVUs: ytdMetrics.ytdTargetWRVUs,
        planProgress: currentMetrics?.planProgress || 0,
        wrvuPercentile: currentMetrics?.wrvuPercentile || 0,
        baseSalary: annualBaseSalary,
        totalCompensation,
        compPercentile: currentMetrics?.compPercentile || 0
      };
    }));

    const response = NextResponse.json({
      data: providerMetrics,
      summary: {
        totalProviders: providers.length,
        averageWRVUPercentile: providerMetrics.reduce((sum, p) => sum + p.wrvuPercentile, 0) / providers.length,
        averagePlanProgress: providerMetrics.reduce((sum, p) => sum + p.planProgress, 0) / providers.length,
        totalWRVUs: providerMetrics.reduce((sum, p) => sum + p.monthlyWRVUs, 0),
        totalCompensation: providerMetrics.reduce((sum, p) => sum + p.totalCompensation, 0)
      },
      pagination: {
        currentPage: 1,
        pageSize: 50,
        totalCount: providers.length,
        totalPages: Math.ceil(providers.length / 50)
      }
    });

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('API Route - Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate monthly performance report' },
      { status: 500 }
    );
  }
} 