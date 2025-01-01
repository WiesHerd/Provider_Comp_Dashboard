import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const allProviderTCCs = providers.map(p => {
      // Calculate YTD incentives and additional pay
      const ytdIncentives = (p.additionalPayments || [])
        .filter(payment => payment.year === currentYear && payment.month <= currentMonth)
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      // Get YTD wRVUs
      const ytdWRVUs = (p.wrvuData || [])
        .filter(data => data.year === currentYear && data.month <= currentMonth)
        .reduce((sum, data) => sum + (data.value || 0), 0);
      
      const annualBaseSalary = p.baseSalary || 0;
      const ytdBaseSalary = (annualBaseSalary / 12) * currentMonth;
      
      return ytdBaseSalary + ytdIncentives;
    }).filter(tcc => tcc > 0); // Only consider providers with compensation

    // Calculate and store metrics for each provider
    const results = await Promise.all(providers.map(async (provider) => {
      try {
        console.log(`Processing provider ${provider.id}`);
        
        // Calculate actual wRVUs including adjustments
        const actualWRVUs = (provider.wrvuData || [])
          .filter(data => data.year === currentYear && data.month === currentMonth)
          .reduce((sum, data) => sum + (data.value || 0), 0) +
          (provider.wrvuAdjustments || [])
          .filter(adj => adj.year === currentYear && adj.month === currentMonth)
          .reduce((sum, adj) => sum + (adj.value || 0), 0);
        console.log(`Actual wRVUs: ${actualWRVUs}`);

        // Calculate target wRVUs including adjustments
        const baseTarget = provider.targetWRVUs || 0;
        const targetAdjustments = (provider.targetAdjustments || [])
          .filter(adj => adj.year === currentYear && adj.month === currentMonth)
          .reduce((sum, adj) => sum + (adj.value || 0), 0);
        const targetWRVUs = baseTarget + targetAdjustments;
        console.log(`Target wRVUs: ${targetWRVUs}`);

        // Calculate additional payments
        const additionalPay = (provider.additionalPayments || [])
          .filter(payment => payment.year === currentYear && payment.month === currentMonth)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Calculate compensation
        const baseSalary = provider.baseSalary || 0;
        const monthlyBase = baseSalary / 12;
        const incentivePay = calculateIncentivePay(actualWRVUs, targetWRVUs, monthlyBase);
        const totalCompensation = monthlyBase + incentivePay + additionalPay;
        console.log(`Total compensation: ${totalCompensation}`);

        // Calculate YTD compensation for this provider
        const ytdIncentives = (provider.additionalPayments || [])
          .filter(payment => payment.year === currentYear && payment.month <= currentMonth)
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        const annualBaseSalary = provider.baseSalary || 0;
        const ytdBaseSalary = (annualBaseSalary / 12) * currentMonth;
        const providerTotalComp = ytdBaseSalary + ytdIncentives;

        // Calculate percentiles
        const wrvuPercentile = calculatePercentile(actualWRVUs, providers.map(p => 
          (p.wrvuData || [])
            .filter(data => data.year === currentYear && data.month === currentMonth)
            .reduce((sum, data) => sum + (data.value || 0), 0)
        ));

        // Calculate TCC percentile using pre-calculated values
        const compPercentile = calculatePercentile(providerTotalComp, allProviderTCCs);

        console.log('Storing metrics...');
        // Store the metrics
        const metrics = await prisma.providerMetrics.upsert({
          where: {
            providerId_year_month: {
              providerId: provider.id,
              year: currentYear,
              month: currentMonth
            }
          },
          update: {
            actualWRVUs,
            targetWRVUs,
            baseSalary,
            totalCompensation,
            wrvuPercentile,
            compPercentile,
            incentivesEarned: incentivePay,
            holdbackAmount: calculateHoldback(incentivePay),
            planProgress: targetWRVUs > 0 ? Math.round((actualWRVUs / targetWRVUs) * 100 * 10) / 10 : 0
          },
          create: {
            providerId: provider.id,
            year: currentYear,
            month: currentMonth,
            actualWRVUs,
            targetWRVUs,
            baseSalary,
            totalCompensation,
            wrvuPercentile,
            compPercentile,
            incentivesEarned: incentivePay,
            holdbackAmount: calculateHoldback(incentivePay),
            planProgress: targetWRVUs > 0 ? Math.round((actualWRVUs / targetWRVUs) * 100 * 10) / 10 : 0
          }
        });

        console.log('Storing analytics...');
        // Store analytics
        await prisma.providerAnalytics.upsert({
          where: {
            providerId_year_month: {
              providerId: provider.id,
              year: currentYear,
              month: currentMonth
            }
          },
          update: {
            ytdProgress: calculateYTDProgress(provider, currentYear, currentMonth),
            ytdTargetProgress: calculateTargetProgress(provider, currentYear, currentMonth),
            incentivePercentage: monthlyBase > 0 ? (incentivePay / monthlyBase) * 100 : 0,
            clinicalUtilization: calculateClinicalUtilization(provider, currentYear, currentMonth)
          },
          create: {
            providerId: provider.id,
            year: currentYear,
            month: currentMonth,
            ytdProgress: calculateYTDProgress(provider, currentYear, currentMonth),
            ytdTargetProgress: calculateTargetProgress(provider, currentYear, currentMonth),
            incentivePercentage: monthlyBase > 0 ? (incentivePay / monthlyBase) * 100 : 0,
            clinicalUtilization: calculateClinicalUtilization(provider, currentYear, currentMonth)
          }
        });

        console.log(`Completed processing provider ${provider.id}`);
        return metrics;
      } catch (providerError) {
        console.error(`Error processing provider ${provider.id}:`, providerError);
        return null; // Skip failed providers instead of throwing
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
  
  const sorted = allValues.sort((a, b) => a - b);
  
  // If value is less than minimum
  if (value < sorted[0]) return 0;
  
  // If value is greater than maximum
  if (value >= sorted[sorted.length - 1]) return 100;
  
  // Find position
  const position = sorted.findIndex(v => v >= value);
  
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
  
  // Calculate prorated annual target including adjustments
  const baseAnnualTarget = (provider.targetWRVUs || 0);
  const targetAdjustments = (provider.targetAdjustments || [])
    .filter((adj: any) => adj.year === year && adj.month <= month)
    .reduce((sum: number, adj: any) => sum + (adj.value || 0), 0);
  const proratedTarget = ((baseAnnualTarget + targetAdjustments) * month) / 12;
  
  return proratedTarget > 0 ? Math.round((ytdWRVUs / proratedTarget) * 100 * 10) / 10 : 0;
}

function calculateTargetProgress(provider: any, year: number, month: number): number {
  // Calculate YTD target including adjustments
  const baseAnnualTarget = (provider.targetWRVUs || 0);
  const targetAdjustments = (provider.targetAdjustments || [])
    .filter((adj: any) => adj.year === year && adj.month <= month)
    .reduce((sum: number, adj: any) => sum + (adj.value || 0), 0);
  const ytdTarget = ((baseAnnualTarget + targetAdjustments) * month) / 12;

  // Calculate YTD actual wRVUs including adjustments
  const ytdActual = (provider.wrvuData || [])
    .filter((data: any) => data.year === year && data.month <= month)
    .reduce((sum: number, data: any) => sum + (data.value || 0), 0) +
    (provider.wrvuAdjustments || [])
    .filter((adj: any) => adj.year === year && adj.month <= month)
    .reduce((sum: number, adj: any) => sum + (adj.value || 0), 0);
  
  return ytdTarget > 0 ? Math.round((ytdActual / ytdTarget) * 100 * 10) / 10 : 0;
}

function calculateClinicalUtilization(provider: any, year: number, month: number): number {
  const clinicalFTE = provider.clinicalFte || 1.0;
  const expectedHours = clinicalFTE * 160; // Assuming 160 hours per month for 1.0 FTE
  const actualHours = (provider.wrvuData || [])
    .filter((data: any) => data.year === year && data.month === month)
    .reduce((sum: number, data: any) => sum + (data.hours || 0), 0);
  
  return expectedHours > 0 ? (actualHours / expectedHours) * 100 : 0;
} 