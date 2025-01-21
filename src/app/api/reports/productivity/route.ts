import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Get all active providers with their metrics and market data
    const providers = await prisma.provider.findMany({
      where: {
        active: true,
      },
      include: {
        metrics: {
          where: {
            year: currentYear,
            month: currentMonth,
          },
        },
        additionalPayments: {
          where: {
            year: currentYear,
          },
        },
      },
    });

    // Get market data for benchmarking
    const marketData = await prisma.marketData.findMany();
    const marketDataBySpecialty = Object.fromEntries(
      marketData.map(data => [data.specialty, data])
    );

    // Transform data for scatter plot
    const transformedData = providers.map(provider => {
      const metrics = provider.metrics[0] || null;
      const marketBenchmarks = marketDataBySpecialty[provider.specialty] || null;
      
      // Calculate total cash compensation
      const additionalPay = provider.additionalPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalCashComp = provider.baseSalary + additionalPay;
      
      // Calculate percentile gaps
      const wrvuPercentile = metrics?.wrvuPercentile || 0;
      const compPercentile = metrics?.compPercentile || 0;
      const percentileGap = wrvuPercentile - compPercentile;

      return {
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        specialty: provider.specialty,
        department: provider.department,
        experience: provider.yearsOfExperience,
        compensation: {
          base: provider.baseSalary,
          additional: additionalPay,
          total: totalCashComp,
          percentile: compPercentile,
        },
        productivity: {
          actualWRVUs: metrics?.actualWRVUs || 0,
          targetWRVUs: metrics?.targetWRVUs || 0,
          percentile: wrvuPercentile,
          ytdProgress: metrics?.ytdWRVUs ? (metrics.ytdWRVUs / metrics.ytdTargetWRVUs) * 100 : 0,
        },
        analysis: {
          percentileGap,
          isAligned: Math.abs(percentileGap) <= 10, // Within 10 percentile points
          performanceCategory: getPerformanceCategory(wrvuPercentile, compPercentile),
        },
        benchmarks: marketBenchmarks ? {
          p50_wrvu: marketBenchmarks.p50_wrvu,
          p75_wrvu: marketBenchmarks.p75_wrvu,
          p50_total: marketBenchmarks.p50_total,
          p75_total: marketBenchmarks.p75_total,
        } : null,
      };
    });

    // Calculate summary statistics
    const summaryStats = {
      alignedCount: transformedData.filter(d => d.analysis.isAligned).length,
      overCompensated: transformedData.filter(d => d.analysis.percentileGap < -10).length,
      underCompensated: transformedData.filter(d => d.analysis.percentileGap > 10).length,
    };

    // Get unique specialties and departments for filtering
    const specialties = [...new Set(providers.map(p => p.specialty))].filter(Boolean);
    const departments = [...new Set(providers.map(p => p.department))].filter(Boolean);

    return NextResponse.json({
      data: transformedData,
      specialties,
      departments,
      summary: summaryStats,
      metadata: {
        totalProviders: providers.length,
        year: currentYear,
        month: currentMonth,
      }
    });
  } catch (error) {
    console.error('Error fetching productivity data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch productivity data' },
      { status: 500 }
    );
  }
}

function getPerformanceCategory(wrvuPercentile: number, compPercentile: number): string {
  const gap = wrvuPercentile - compPercentile;
  if (Math.abs(gap) <= 10) return 'Aligned';
  if (gap > 10) return 'High Productivity / Low Compensation';
  return 'Low Productivity / High Compensation';
} 