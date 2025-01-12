import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Get all providers with their related data
    const providers = await prisma.provider.findMany({
      include: {
        wrvuData: true,
        wrvuAdjustments: true,
        targetAdjustments: true,
      }
    });

    // Get market data for benchmarking
    const marketData = await prisma.marketData.findMany();

    const currentYear = 2024; // Hardcoded to 2024 as per application setting
    const results = [];

    // Process each provider
    for (const provider of providers) {
      // Process each month (1-12)
      for (let month = 1; month <= 12; month++) {
        try {
          // 1. Calculate Monthly WRVUs
          const monthlyWRVUs = provider.wrvuData
            .filter(data => data.year === currentYear && data.month === month)
            .reduce((sum, data) => sum + (data.value || 0), 0);

          // 2. Calculate Monthly Adjustments
          const monthlyAdjustments = provider.wrvuAdjustments
            ?.filter(adj => adj.year === currentYear && adj.month === month)
            .reduce((sum, adj) => sum + (adj.value || 0), 0) || 0;

          // 3. Calculate Cumulative WRVUs (YTD)
          const cumulativeWRVUs = provider.wrvuData
            .filter(data => data.year === currentYear && data.month <= month)
            .reduce((sum, data) => sum + (data.value || 0), 0);

          // 4. Calculate Cumulative Adjustments (YTD)
          const cumulativeAdjustments = provider.wrvuAdjustments
            ?.filter(adj => adj.year === currentYear && adj.month <= month)
            .reduce((sum, adj) => sum + (adj.value || 0), 0) || 0;

          // 5. Calculate Target WRVUs
          const annualTarget = provider.targetWRVUs || 0;
          const monthlyTarget = annualTarget / 12;

          // 6. Calculate Target Adjustments
          const monthlyTargetAdjustments = provider.targetAdjustments
            ?.filter(adj => adj.year === currentYear && adj.month === month)
            .reduce((sum, adj) => sum + (adj.value || 0), 0) || 0;

          const cumulativeTargetAdjustments = provider.targetAdjustments
            ?.filter(adj => adj.year === currentYear && adj.month <= month)
            .reduce((sum, adj) => sum + (adj.value || 0), 0) || 0;

          // 7. Calculate WRVU Percentile
          const matchingMarket = marketData.find(m => m.specialty === provider.specialty);
          let wrvuPercentile = 0;

          if (matchingMarket) {
            const annualizedWRVUs = month > 0 ? (cumulativeWRVUs / month) * 12 : 0;
            const fteAdjustedWRVUs = provider.clinicalFte < 1.0 
              ? annualizedWRVUs / provider.clinicalFte 
              : annualizedWRVUs;

            const benchmarks = [
              { percentile: 25, value: matchingMarket.p25_wrvu || 0 },
              { percentile: 50, value: matchingMarket.p50_wrvu || 0 },
              { percentile: 75, value: matchingMarket.p75_wrvu || 0 },
              { percentile: 90, value: matchingMarket.p90_wrvu || 0 }
            ];

            // Calculate percentile
            if (fteAdjustedWRVUs < benchmarks[0].value) {
              wrvuPercentile = benchmarks[0].value > 0 ? (fteAdjustedWRVUs / benchmarks[0].value) * 25 : 0;
            } else if (fteAdjustedWRVUs > benchmarks[3].value) {
              const extraPercentile = benchmarks[3].value > 0 
                ? ((fteAdjustedWRVUs - benchmarks[3].value) / benchmarks[3].value) * 10 
                : 0;
              wrvuPercentile = Math.min(100, 90 + extraPercentile);
            } else {
              for (let i = 0; i < benchmarks.length - 1; i++) {
                const lower = benchmarks[i];
                const upper = benchmarks[i + 1];
                if (fteAdjustedWRVUs >= lower.value && fteAdjustedWRVUs <= upper.value) {
                  const range = upper.value - lower.value;
                  const position = fteAdjustedWRVUs - lower.value;
                  const percentileRange = upper.percentile - lower.percentile;
                  wrvuPercentile = range > 0 
                    ? lower.percentile + (position / range) * percentileRange 
                    : lower.percentile;
                  break;
                }
              }
            }
          }

          // 8. Calculate Plan Progress
          const cumulativeTarget = (monthlyTarget * month) + cumulativeTargetAdjustments;
          const planProgress = cumulativeTarget > 0 
            ? ((cumulativeWRVUs + cumulativeAdjustments) / cumulativeTarget) * 100 
            : 0;

          // 9. Store metrics in database
          const metrics = await prisma.providerMetrics.upsert({
            where: {
              providerId_year_month: {
                providerId: provider.id,
                year: currentYear,
                month: month
              }
            },
            create: {
              providerId: provider.id,
              year: currentYear,
              month: month,
              actualWRVUs: monthlyWRVUs + monthlyAdjustments,
              rawMonthlyWRVUs: monthlyWRVUs,
              ytdWRVUs: cumulativeWRVUs + cumulativeAdjustments,
              targetWRVUs: monthlyTarget + monthlyTargetAdjustments,
              ytdTargetWRVUs: cumulativeTarget,
              baseSalary: provider.baseSalary || 0,
              totalCompensation: (provider.baseSalary || 0) / 12,
              incentivesEarned: 0,
              holdbackAmount: 0,
              wrvuPercentile: wrvuPercentile,
              compPercentile: 0,
              planProgress: planProgress,
              monthsCompleted: month
            },
            update: {
              actualWRVUs: monthlyWRVUs + monthlyAdjustments,
              rawMonthlyWRVUs: monthlyWRVUs,
              ytdWRVUs: cumulativeWRVUs + cumulativeAdjustments,
              targetWRVUs: monthlyTarget + monthlyTargetAdjustments,
              ytdTargetWRVUs: cumulativeTarget,
              baseSalary: provider.baseSalary || 0,
              totalCompensation: (provider.baseSalary || 0) / 12,
              wrvuPercentile: wrvuPercentile,
              planProgress: planProgress
            }
          });

          results.push(metrics);
        } catch (error) {
          console.error(`Error processing provider ${provider.firstName} ${provider.lastName} for month ${month}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: 'Provider metrics recalculated successfully',
      count: results.length
    });

  } catch (error) {
    console.error('Error recalculating provider metrics:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate provider metrics' },
      { status: 500 }
    );
  }
} 