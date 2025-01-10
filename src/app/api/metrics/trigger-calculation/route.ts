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

    // Log provider data
    providers.forEach(provider => {
      console.log(`\nProvider: ${provider.firstName} ${provider.lastName}`);
      console.log('Base Salary:', provider.baseSalary);
      console.log('Target WRVUs:', provider.targetWRVUs);
      console.log('WRVU Data Count:', provider.wrvuData.length);
      console.log('WRVU Adjustments Count:', provider.wrvuAdjustments.length);
      console.log('Target Adjustments Count:', provider.targetAdjustments.length);
    });

    // Use 2024 since that's where our data is
    const currentYear = 2024;
    
    // Calculate metrics for each month
    const allResults: any[] = [];
    for (let currentMonth = 1; currentMonth <= 12; currentMonth++) {
      console.log(`\nCalculating metrics for ${currentYear}-${currentMonth}`);

      const monthResults = await Promise.all(providers.map(async (provider) => {
        try {
          console.log(`\n=== Processing Provider for ${currentYear}-${currentMonth} ===`);
          console.log(`Provider: ${provider.firstName} ${provider.lastName}`);
          
          // Get all wRVU data for the current month
          const currentMonthData = provider.wrvuData.filter(
            data => data.year === currentYear && data.month === currentMonth
          );

          console.log('Current month data:', JSON.stringify(currentMonthData, null, 2));

          // Calculate actual wRVUs for current month
          const actualWRVUs = currentMonthData.reduce((sum, data) => {
            console.log('Adding value:', data.value);
            return sum + (data.value || 0);
          }, 0);
          
          // Calculate cumulative WRVUs including all months up to current
          const cumulativeWRVUs = provider.wrvuData
            .filter(data => data.year === currentYear && data.month <= currentMonth)
            .reduce((sum, data) => sum + (data.value || 0), 0);

          // Get current month's wRVU adjustments
          const currentMonthAdjustments = (provider.wrvuAdjustments || [])
            .filter(adj => adj.year === currentYear && adj.month === currentMonth)
            .reduce((sum, adj) => sum + (adj.value || 0), 0);

          // Get cumulative wRVU adjustments
          const cumulativeAdjustments = (provider.wrvuAdjustments || [])
            .filter(adj => adj.year === currentYear && adj.month <= currentMonth)
            .reduce((sum, adj) => sum + (adj.value || 0), 0);

          // Calculate target wRVUs
          const annualTarget = provider.targetWRVUs || 0;
          const monthlyTarget = (annualTarget / 12) * provider.clinicalFte;

          // Get current month's target adjustments
          const currentMonthTargetAdjustments = (provider.targetAdjustments || [])
            .filter(adj => adj.year === currentYear && adj.month === currentMonth)
            .reduce((sum, adj) => sum + (adj.value || 0), 0);

          // Get cumulative target adjustments
          const cumulativeTargetAdjustments = (provider.targetAdjustments || [])
            .filter(adj => adj.year === currentYear && adj.month <= currentMonth)
            .reduce((sum, adj) => sum + (adj.value || 0), 0);

          // Calculate cumulative target (prorated by month and clinical FTE)
          const cumulativeTarget = ((monthlyTarget * currentMonth) + cumulativeTargetAdjustments) * provider.clinicalFte;

          console.log('Target Calculations:', {
            provider: `${provider.firstName} ${provider.lastName}`,
            annualTarget,
            monthlyTarget,
            clinicalFte: provider.clinicalFte,
            currentMonthTargetAdjustments,
            cumulativeTargetAdjustments,
            cumulativeTarget
          });

          // Calculate base salary and total compensation
          const baseSalary = provider.baseSalary || 0;
          const monthlyBaseSalary = baseSalary / 12;

          console.log('WRVU Calculations:', {
            provider: `${provider.firstName} ${provider.lastName}`,
            month: currentMonth,
            actualWRVUs,
            currentMonthAdjustments,
            cumulativeWRVUs,
            cumulativeAdjustments,
            monthlyTarget,
            currentMonthTargetAdjustments,
            cumulativeTargetAdjustments,
            baseSalary,
            monthlyBaseSalary
          });

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
              actualWRVUs: actualWRVUs + currentMonthAdjustments,
              rawMonthlyWRVUs: actualWRVUs,
              cumulativeWRVUs: cumulativeWRVUs + cumulativeAdjustments,
              targetWRVUs: monthlyTarget + currentMonthTargetAdjustments,
              cumulativeTarget: cumulativeTarget,
              baseSalary: baseSalary,
              totalCompensation: monthlyBaseSalary,
              incentivesEarned: 0,
              holdbackAmount: 0,
              wrvuPercentile: 0,
              compPercentile: 0,
              planProgress: cumulativeTarget > 0 ? ((cumulativeWRVUs + cumulativeAdjustments) / cumulativeTarget) * 100 : 0,
              monthsCompleted: currentMonth
            },
            update: {
              actualWRVUs: actualWRVUs + currentMonthAdjustments,
              rawMonthlyWRVUs: actualWRVUs,
              cumulativeWRVUs: cumulativeWRVUs + cumulativeAdjustments,
              targetWRVUs: monthlyTarget + currentMonthTargetAdjustments,
              cumulativeTarget: cumulativeTarget,
              baseSalary: baseSalary,
              totalCompensation: monthlyBaseSalary,
              planProgress: cumulativeTarget > 0 ? ((cumulativeWRVUs + cumulativeAdjustments) / cumulativeTarget) * 100 : 0
            }
          });

          console.log('Stored metrics:', JSON.stringify(metrics, null, 2));
          return metrics;
        } catch (providerError) {
          console.error(`Error processing provider ${provider.firstName} ${provider.lastName}:`, providerError);
          return null;
        }
      }));

      const validResults = monthResults.filter(r => r !== null);
      allResults.push(...validResults);
      console.log(`Processed ${validResults.length} providers for month ${currentMonth}`);
    }

    console.log(`Total metrics calculated: ${allResults.length}`);
    return NextResponse.json({ 
      message: `Successfully calculated metrics for ${allResults.length} provider-months`,
      results: allResults
    });
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 