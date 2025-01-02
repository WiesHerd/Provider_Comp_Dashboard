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
    console.log('Sample of provider base salaries:', providers.slice(0, 5).map(p => ({
      id: p.id,
      employeeId: p.employeeId,
      name: `${p.firstName} ${p.lastName}`,
      baseSalary: p.baseSalary,
      hasBaseSalary: p.baseSalary > 0
    })));

    if (providers.length === 0) {
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

    // Pre-calculate all provider TCCs for percentile calculation
    console.log('Starting TCC calculations...');
    const allProviderTCCs = providers.map(p => {
      try {
        // Log raw provider data first
        console.log(`Raw provider data for ${p.firstName} ${p.lastName}:`, {
          id: p.id,
          baseSalary: p.baseSalary,
          hasBaseSalary: p.baseSalary > 0,
          additionalPaymentsCount: p.additionalPayments?.length
        });

        // Calculate YTD incentives and additional pay
        const ytdIncentives = (p.additionalPayments || [])
          .filter(payment => payment.year === currentYear && payment.month <= currentMonth)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        const annualBaseSalary = p.baseSalary || 0;
        const ytdBaseSalary = (annualBaseSalary / 12) * currentMonth;
        const totalComp = ytdBaseSalary + ytdIncentives;
        
        console.log(`Provider ${p.firstName} ${p.lastName} TCC calculation:`, {
          ytdIncentives,
          annualBaseSalary,
          ytdBaseSalary,
          totalComp,
          hasAdditionalPayments: p.additionalPayments?.length > 0,
          additionalPaymentsCount: p.additionalPayments?.length
        });
        
        return totalComp;
      } catch (error) {
        console.error(`Error calculating TCC for provider ${p.firstName} ${p.lastName}:`, error);
        return 0;
      }
    });

    console.log('All provider TCCs:', {
      count: allProviderTCCs.length,
      values: allProviderTCCs,
      nonZeroCount: allProviderTCCs.filter(tcc => tcc > 0).length
    });

    // Calculate and store metrics for each provider
    const results = await Promise.all(providers.map(async (provider) => {
      try {
        console.log(`Processing provider ${provider.id}`);
        
        // Calculate actual wRVUs including adjustments for current month
        const actualWRVUs = (provider.wrvuData || [])
          .filter(data => data.year === currentYear && data.month === currentMonth)
          .reduce((sum, data) => sum + (data.value || 0), 0) +
          (provider.wrvuAdjustments || [])
          .filter(adj => adj.year === currentYear && adj.month === currentMonth)
          .reduce((sum, adj) => sum + (adj.value || 0), 0);
        console.log(`Raw actual wRVUs for month: ${actualWRVUs}`);

        // Get YTD wRVUs
        const ytdWRVUs = (provider.wrvuData || [])
          .filter(data => data.year === currentYear && data.month <= currentMonth)
          .reduce((sum, data) => sum + (data.value || 0), 0) +
          (provider.wrvuAdjustments || [])
          .filter(adj => adj.year === currentYear && adj.month <= currentMonth)
          .reduce((sum, adj) => sum + (adj.value || 0), 0);

        // Annualize the YTD wRVUs
        const annualizedWRVUs = currentMonth > 0 ? (ytdWRVUs / currentMonth) * 12 : 0;
        
        // Adjust for FTE (gross up to 1.0 FTE)
        const fteAdjustedWRVUs = provider.fte > 0 ? annualizedWRVUs / provider.fte : annualizedWRVUs;
        
        console.log(`wRVU calculations for ${provider.firstName} ${provider.lastName}:`, {
          currentMonthWRVUs: actualWRVUs,
          ytdWRVUs,
          annualizedWRVUs,
          fte: provider.fte,
          fteAdjustedWRVUs
        });

        // Get market data for specialty
        const marketData = await prisma.marketData.findFirst({
          where: {
            specialty: provider.specialty
          }
        });

        // Calculate target wRVUs based on base salary and conversion factor
        const conversionFactor = marketData?.p50_cf || 81.20; // Default to 81.20 if not found
        const annualTarget = provider.baseSalary / conversionFactor;
        const monthlyTarget = annualTarget / 12;

        // Calculate additional payments
        const additionalPay = (provider.additionalPayments || [])
          .filter(payment => payment.year === currentYear && payment.month === currentMonth)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Calculate compensation using the same logic as the dashboard
        const annualBaseSalary = provider.baseSalary || 0;
        const monthlyBaseSalary = annualBaseSalary / 12;

        // Calculate YTD compensation
        const ytdBaseSalary = monthlyBaseSalary * currentMonth;
        const ytdIncentives = (provider.additionalPayments || [])
          .filter(payment => payment.year === currentYear && payment.month <= currentMonth)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Calculate monthly compensation
        const monthlyIncentives = (provider.additionalPayments || [])
          .filter(payment => payment.year === currentYear && payment.month === currentMonth)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const monthlyTotalComp = monthlyBaseSalary + monthlyIncentives;

        // Annualize base salary
        const annualizedBaseSalary = currentMonth > 0 ? (ytdBaseSalary / currentMonth) * 12 : 0;
        // Add YTD incentives without annualizing
        const annualizedTotalComp = annualizedBaseSalary + ytdIncentives;

        // Adjust for FTE if less than 1.0
        const fteAdjustedTotalComp = provider.fte < 1.0 ? annualizedTotalComp / provider.fte : annualizedTotalComp;

        // Calculate total comp percentile using market data
        const matchingMarket = marketData.find(data => data.specialty === provider.specialty);
        let compPercentile = 0;

        if (matchingMarket) {
          const benchmarks = [
            { percentile: 25, value: matchingMarket.p25_total || 0 },
            { percentile: 50, value: matchingMarket.p50_total || 0 },
            { percentile: 75, value: matchingMarket.p75_total || 0 },
            { percentile: 90, value: matchingMarket.p90_total || 0 }
          ];

          // If below 25th percentile
          if (fteAdjustedTotalComp < benchmarks[0].value) {
            compPercentile = benchmarks[0].value > 0 ? (fteAdjustedTotalComp / benchmarks[0].value) * 25 : 0;
          }
          // If above 90th percentile
          else if (fteAdjustedTotalComp > benchmarks[3].value) {
            compPercentile = benchmarks[3].value > 0 
              ? Math.min(100, 90 + ((fteAdjustedTotalComp - benchmarks[3].value) / benchmarks[3].value) * 10)
              : 90;
          }
          // Find which benchmarks we're between
          else {
            for (let i = 0; i < benchmarks.length - 1; i++) {
              const lower = benchmarks[i];
              const upper = benchmarks[i + 1];
              if (fteAdjustedTotalComp >= lower.value && fteAdjustedTotalComp <= upper.value) {
                const range = upper.value - lower.value;
                const position = fteAdjustedTotalComp - lower.value;
                const percentileRange = upper.percentile - lower.percentile;
                compPercentile = range > 0 
                  ? lower.percentile + (position / range) * percentileRange 
                  : lower.percentile;
                break;
              }
            }
          }
        }

        console.log(`Total comp calculations for ${provider.firstName} ${provider.lastName}:`, {
          ytdBaseSalary,
          ytdIncentives,
          annualizedBaseSalary,
          annualizedTotalComp,
          fte: provider.fte,
          fteAdjustedTotalComp,
          compPercentile
        });

        // Calculate wRVU percentile using market data benchmarks
        const wrvuPercentile = calculateWRVUPercentile(
          ytdWRVUs,
          currentMonth,
          provider.fte || 1.0,
          marketData
        );

        // Store metrics in database
        const metrics = await prisma.providerMetrics.upsert({
          where: {
            providerId_year_month: {
              providerId: provider.id,
              year: currentYear,
              month: currentMonth
            }
          },
          update: {
            actualWRVUs: annualizedWRVUs,
            rawMonthlyWRVUs: actualWRVUs,
            ytdWRVUs: ytdWRVUs,
            targetWRVUs: monthlyTarget,
            baseSalary: monthlyBaseSalary,
            totalCompensation: monthlyTotalComp,
            wrvuPercentile: wrvuPercentile,
            compPercentile: compPercentile,
            incentivesEarned: monthlyIncentives,
            holdbackAmount: calculateHoldback(monthlyIncentives),
            planProgress: monthlyTarget > 0 ? (actualWRVUs / monthlyTarget) * 100 : 0
          },
          create: {
            providerId: provider.id,
            year: currentYear,
            month: currentMonth,
            actualWRVUs: annualizedWRVUs,
            rawMonthlyWRVUs: actualWRVUs,
            ytdWRVUs: ytdWRVUs,
            targetWRVUs: monthlyTarget,
            baseSalary: monthlyBaseSalary,
            totalCompensation: monthlyTotalComp,
            wrvuPercentile: wrvuPercentile,
            compPercentile: compPercentile,
            incentivesEarned: monthlyIncentives,
            holdbackAmount: calculateHoldback(monthlyIncentives),
            planProgress: monthlyTarget > 0 ? (actualWRVUs / monthlyTarget) * 100 : 0
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

// Helper function to calculate wRVU percentile using market data benchmarks
function calculateWRVUPercentile(actualWRVUs: number, monthsCompleted: number, fte: number, marketData: any): number {
  if (!marketData) {
    console.log('No market data available for percentile calculation');
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

  // Find which benchmarks we're between
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
} 

// Helper function to calculate compensation percentile using market data benchmarks
function calculateCompPercentile(totalComp: number, marketData: any): number {
  if (!marketData) {
    console.log('No market data available for percentile calculation');
    return 0;
  }

  const benchmarks = [
    { percentile: 25, value: marketData.p25_total || 0 },
    { percentile: 50, value: marketData.p50_total || 0 },
    { percentile: 75, value: marketData.p75_total || 0 },
    { percentile: 90, value: marketData.p90_total || 0 }
  ];

  // If below 25th percentile
  if (totalComp < benchmarks[0].value) {
    return benchmarks[0].value > 0 ? (totalComp / benchmarks[0].value) * 25 : 0;
  }

  // If above 90th percentile
  if (totalComp > benchmarks[3].value) {
    const extraPercentile = benchmarks[3].value > 0 
      ? ((totalComp - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 0;
    return Math.min(100, 90 + extraPercentile);
  }

  // Find which benchmarks we're between
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (totalComp >= lower.value && totalComp <= upper.value) {
      const range = upper.value - lower.value;
      const position = totalComp - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      return range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
    }
  }

  return 0;
} 