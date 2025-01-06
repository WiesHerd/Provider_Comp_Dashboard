import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    console.log('Starting metrics calculation...');
    
    // Get all providers (not just active)
    const providers = await prisma.provider.findMany({
      include: {
        wrvuData: true,
        wrvuAdjustments: true,
        targetAdjustments: true,
        additionalPayments: true,
        compensationChanges: true
      }
    });
    
    console.log(`Found ${providers.length} providers`);
    if (providers.length === 0) {
      console.log('No providers found in the database');
      return NextResponse.json({ 
        message: 'No providers found',
        results: [] 
      });
    }

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    console.log(`Calculating metrics for ${currentYear}-${currentMonth}`);

    // Get market data for all specialties
    const marketData = await prisma.marketData.findMany();
    console.log(`Found ${marketData.length} market data entries`);

    // Calculate and store metrics for each provider
    const results = await Promise.all(providers.map(async (provider) => {
      try {
        // Get all wRVU data for the current month
        const currentMonthData = provider.wrvuData.filter(
          data => data.year === currentYear && data.month === currentMonth
        );

        console.log(`Processing wRVUs for ${provider.firstName} ${provider.lastName}:`, {
          currentYear,
          currentMonth,
          wrvuDataCount: provider.wrvuData.length,
          currentMonthDataCount: currentMonthData.length
        });

        // Calculate actual wRVUs for current month
        const actualWRVUs = currentMonthData.reduce((sum, data) => sum + (data.value || 0), 0);

        // Get previous month's data for MoM trend
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const previousMonthData = provider.wrvuData.filter(
          data => data.year === previousYear && data.month === previousMonth
        );
        const previousMonthWRVUs = previousMonthData.reduce((sum, data) => sum + (data.value || 0), 0);

        // Calculate MoM trend
        const momTrend = previousMonthWRVUs > 0 
          ? ((actualWRVUs - previousMonthWRVUs) / previousMonthWRVUs) * 100 
          : 0;

        // Calculate YTD wRVUs including adjustments
        const ytdData = provider.wrvuData.filter(
          data => data.year === currentYear && data.month <= currentMonth
        );
        const ytdWRVUs = ytdData.reduce((sum, data) => sum + (data.value || 0), 0);

        // Calculate YTD target including adjustments
        const baseMonthlyTarget = (provider.targetWRVUs || 0) / 12;
        const ytdBaseTarget = baseMonthlyTarget * currentMonth;

        // Get YTD adjustments
        const ytdTargetAdjustments = (provider.targetAdjustments || [])
          .filter((adj: any) => adj.year === currentYear && adj.month <= currentMonth)
          .reduce((sum: number, adj: any) => sum + (adj.value || 0), 0);

        const ytdTarget = ytdBaseTarget + ytdTargetAdjustments;

        // Calculate YTD progress
        const ytdProgress = ytdTarget > 0 ? (ytdWRVUs / ytdTarget) * 100 : 0;

        // Calculate current month target with adjustments
        const currentMonthAdjustments = (provider.targetAdjustments || [])
          .filter((adj: any) => adj.year === currentYear && adj.month === currentMonth)
          .reduce((sum: number, adj: any) => sum + (adj.value || 0), 0);

        const currentMonthTarget = baseMonthlyTarget + currentMonthAdjustments;

        console.log(`Provider ${provider.firstName} ${provider.lastName} metrics:`, {
          ytdWRVUs,
          currentMonth,
          fte: provider.clinicalFte,
          wrvuPercentile: calculateWRVUPercentile(ytdWRVUs, currentMonth, provider.clinicalFte, marketData)
        });

        // Get market data for provider's specialty
        const providerMarketData = marketData.find(data => data.specialty === provider.specialty);
        if (!providerMarketData) {
          console.log(`No market data found for specialty: ${provider.specialty}`);
          return null;
        }

        // Calculate wRVU percentile
        const wrvuPercentile = calculateWRVUPercentile(
          ytdWRVUs,
          currentMonth,
          provider.clinicalFte,
          providerMarketData
        );

        // Calculate compensation using the same logic as the dashboard
        const annualBaseSalary = provider.baseSalary || 0;
        const monthlyBaseSalary = annualBaseSalary / 12;

        // Calculate additional payments
        const additionalPay = (provider.additionalPayments || [])
          .filter(payment => payment.year === currentYear && payment.month === currentMonth)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Calculate monthly incentives and total compensation
        const monthlyIncentives = additionalPay;
        const monthlyTotalComp = monthlyBaseSalary + monthlyIncentives;

        // Calculate compensation percentile
        const compPercentile = calculateCompPercentile(monthlyTotalComp, providerMarketData);

        // Store metrics in database
        const metrics = await prisma.providerMetrics.upsert({
          where: {
            providerId_year_month: {
              providerId: provider.id,
              year: currentYear,
              month: currentMonth
            }
          },
          create: {
            providerId: provider.id,
            year: currentYear,
            month: currentMonth,
            actualWRVUs,
            rawMonthlyWRVUs: actualWRVUs,
            cumulativeWRVUs: ytdWRVUs,
            targetWRVUs: baseMonthlyTarget,
            cumulativeTarget: ytdTarget,
            wrvuPercentile,
            compPercentile,
            baseSalary: monthlyBaseSalary,
            totalCompensation: monthlyTotalComp,
            incentivesEarned: monthlyIncentives,
            holdbackAmount: calculateHoldback(monthlyIncentives),
            planProgress: baseMonthlyTarget > 0 ? (actualWRVUs / baseMonthlyTarget) * 100 : 0,
            monthsCompleted: currentMonth
          },
          update: {
            actualWRVUs,
            rawMonthlyWRVUs: actualWRVUs,
            cumulativeWRVUs: ytdWRVUs,
            targetWRVUs: baseMonthlyTarget,
            cumulativeTarget: ytdTarget,
            wrvuPercentile,
            compPercentile,
            baseSalary: monthlyBaseSalary,
            totalCompensation: monthlyTotalComp,
            incentivesEarned: monthlyIncentives,
            holdbackAmount: calculateHoldback(monthlyIncentives),
            planProgress: baseMonthlyTarget > 0 ? (actualWRVUs / baseMonthlyTarget) * 100 : 0,
            monthsCompleted: currentMonth
          }
        });

        return metrics;
      } catch (providerError) {
        console.error(`Error processing provider ${provider.firstName} ${provider.lastName}:`, providerError);
        return null;
      }
    }));

    const successfulResults = results.filter(r => r !== null);
    return NextResponse.json({ 
      message: `Successfully calculated metrics for ${successfulResults.length} providers`,
      results: successfulResults
    });
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateIncentivePay(actual: number, target: number, baseMonthly: number): number {
  if (actual >= target) {
    return baseMonthly * 0.1; // 10% bonus for meeting target
  }
  return 0;
}

function calculateHoldback(incentivePay: number): number {
  return incentivePay * 0.2; // 20% holdback on incentive pay
}

function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;
  if (allValues.length === 1) return value >= allValues[0] ? 100 : 0;
  
  // Filter out zero values to avoid skewing percentiles
  const nonZeroValues = allValues.filter(v => v > 0);
  if (nonZeroValues.length === 0) return 0;
  
  const sorted = nonZeroValues.sort((a, b) => a - b);
  
  // If value is less than minimum
  if (value <= 0 || value < sorted[0]) return 0;
  
  // If value is greater than maximum
  if (value >= sorted[sorted.length - 1]) return 100;
  
  // Find position
  let position = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (value <= sorted[i]) {
      position = i;
      break;
    }
  }
  
  // Calculate percentile
  return Math.round((position / (sorted.length - 1)) * 100);
}

function calculateYTDProgress(provider: any, year: number, month: number): number {
  // Get all wRVU data for the year up to current month
  const ytdWRVUs = (provider.wrvuData || [])
    .filter((data: any) => data.year === year && data.month <= month)
    .reduce((sum: number, data: any) => sum + (data.value || 0), 0) +
    // Add all wRVU adjustments
    (provider.wrvuAdjustments || [])
    .filter((adj: any) => adj.year === year && adj.month <= month)
    .reduce((sum: number, adj: any) => sum + (adj.value || 0), 0);
  
  // Annualize the YTD wRVUs
  const annualizedWRVUs = month > 0 ? (ytdWRVUs / month) * 12 : 0;
  
  // Adjust for FTE
  const fteAdjustedWRVUs = provider.fte > 0 ? annualizedWRVUs / provider.fte : annualizedWRVUs;
  
  // Calculate prorated annual target including adjustments
  const baseAnnualTarget = (provider.targetWRVUs || 0);
  
  return baseAnnualTarget > 0 ? Math.round((fteAdjustedWRVUs / baseAnnualTarget) * 100 * 10) / 10 : 0;
}

function calculateTargetProgress(provider: any, year: number, month: number): number {
  const baseTarget = provider.targetWRVUs || 0;
  const targetAdjustments = (provider.targetAdjustments || [])
    .filter((adj: any) => adj.year === year && adj.month <= month)
    .reduce((sum: number, adj: any) => sum + (adj.value || 0), 0);
  return baseTarget + targetAdjustments;
}

function calculateClinicalUtilization(provider: any, year: number, month: number): number {
  const totalHours = (provider.wrvuData || [])
    .filter((data: any) => data.year === year && data.month === month)
    .reduce((sum: number, data: any) => sum + (data.hours || 0), 0);
  
  // Assuming a standard 160 hours per month for 1.0 FTE
  const expectedHours = 160 * provider.clinicalFte;
  
  return expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100 * 10) / 10 : 0;
}

// Helper function to calculate wRVU percentile
const calculateWRVUPercentile = (actualWRVUs: number, monthsCompleted: number, fte: number, marketData: any): number => {
  if (!marketData) {
    return 0;
  }

  // Annualize wRVUs
  const annualizedWRVUs = monthsCompleted > 0 
    ? (actualWRVUs / monthsCompleted) * 12 
    : 0;

  // Adjust for FTE
  const fteAdjustedWRVUs = fte < 1.0 
    ? annualizedWRVUs / fte 
    : annualizedWRVUs;

  const benchmarks = [
    { percentile: 25, value: marketData.p25_wrvu || 0 },
    { percentile: 50, value: marketData.p50_wrvu || 0 },
    { percentile: 75, value: marketData.p75_wrvu || 0 },
    { percentile: 90, value: marketData.p90_wrvu || 0 }
  ];

  // If below 25th percentile
  if (fteAdjustedWRVUs < benchmarks[0].value) {
    return benchmarks[0].value > 0 ? (fteAdjustedWRVUs / benchmarks[0].value) * 25 : 0;
  }

  // If above 90th percentile
  if (fteAdjustedWRVUs > benchmarks[3].value) {
    const extraPercentile = benchmarks[3].value > 0 
      ? ((fteAdjustedWRVUs - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 0;
    return Math.min(100, 90 + extraPercentile);
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedWRVUs >= lower.value && fteAdjustedWRVUs <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedWRVUs - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      return range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
    }
  }

  return 0;
};

// Helper function to calculate compensation percentile using market data benchmarks
function calculateCompPercentile(totalComp: number, marketData: any): number {
  if (!marketData) return 0;
  
  const annualizedComp = totalComp * 12;
  if (annualizedComp <= marketData.p25_total) return 25;
  if (annualizedComp <= marketData.p50_total) return 50;
  if (annualizedComp <= marketData.p75_total) return 75;
  if (annualizedComp <= marketData.p90_total) return 90;
  return 100;
} 