import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST() {
  try {
    const prisma = new PrismaClient();
    const currentYear = new Date().getFullYear();

    // Get all providers with their wRVU data and adjustments
    const providers = await prisma.provider.findMany({
      include: {
        wrvuData: true,
        wrvuAdjustments: true,
        targetAdjustments: true
      }
    });

    // Get market data for conversion factors
    const marketData = await prisma.marketData.findMany();

    const allResults: any[] = [];
    
    // Calculate metrics for each month
    for (let currentMonth = 1; currentMonth <= 12; currentMonth++) {
      console.log(`\nCalculating metrics for ${currentYear}-${currentMonth}`);

      const monthResults = await Promise.all(providers.map(async (provider) => {
        try {
          console.log(`\n=== Processing Provider for ${currentYear}-${currentMonth} ===`);
          console.log(`Provider: ${provider.firstName} ${provider.lastName} (${provider.specialty})`);
          
          // Get matching market data for conversion factor
          const matchingMarket = marketData.find(m => m.specialty === provider.specialty);
          console.log('Market data match:', matchingMarket ? 'Found' : 'Not found');
          
          // Use a default conversion factor if no market data found
          const conversionFactor = matchingMarket?.p50_cf || 55; // Default CF of 55 if no market data
          console.log('Using conversion factor:', conversionFactor);

          // Calculate base monthly target from base salary and conversion factor
          const annualBaseSalary = provider.baseSalary || 0;
          const baseMonthlyTarget = (annualBaseSalary / 12) / conversionFactor;
          
          // Get all wRVU data for the current month
          const currentMonthData = provider.wrvuData.filter(
            data => data.year === currentYear && data.month === currentMonth
          );

          // Calculate actual wRVUs for current month
          const actualWRVUs = currentMonthData.reduce((sum, data) => {
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

          // Get current month's target adjustments
          const currentMonthTargetAdjustments = (provider.targetAdjustments || [])
            .filter(adj => adj.year === currentYear && adj.month === currentMonth)
            .reduce((sum, adj) => sum + (adj.value || 0), 0);

          // Get cumulative target adjustments
          const cumulativeTargetAdjustments = (provider.targetAdjustments || [])
            .filter(adj => adj.year === currentYear && adj.month <= currentMonth)
            .reduce((sum, adj) => sum + (adj.value || 0), 0);

          // Calculate monthly target (prorated by clinical FTE)
          const monthlyTarget = baseMonthlyTarget * provider.clinicalFte;

          // Calculate cumulative target
          const cumulativeTarget = (monthlyTarget * currentMonth) + cumulativeTargetAdjustments;

          console.log('Target Calculations:', {
            provider: `${provider.firstName} ${provider.lastName}`,
            specialty: provider.specialty,
            annualBaseSalary,
            conversionFactor,
            baseMonthlyTarget,
            clinicalFte: provider.clinicalFte,
            monthlyTarget,
            currentMonthTargetAdjustments,
            cumulativeTargetAdjustments,
            cumulativeTarget
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
              baseSalary: annualBaseSalary,
              totalCompensation: annualBaseSalary / 12, // Monthly base salary
              incentivesEarned: 0,
              holdbackAmount: 0,
              wrvuPercentile: 0,
              compPercentile: 0,
              planProgress: cumulativeTarget > 0 ? ((cumulativeWRVUs + cumulativeAdjustments) / cumulativeTarget) * 100 : 0
            },
            update: {
              actualWRVUs: actualWRVUs + currentMonthAdjustments,
              rawMonthlyWRVUs: actualWRVUs,
              cumulativeWRVUs: cumulativeWRVUs + cumulativeAdjustments,
              targetWRVUs: monthlyTarget + currentMonthTargetAdjustments,
              cumulativeTarget: cumulativeTarget,
              baseSalary: annualBaseSalary,
              totalCompensation: annualBaseSalary / 12, // Monthly base salary
              incentivesEarned: 0,
              holdbackAmount: 0,
              wrvuPercentile: 0,
              compPercentile: 0,
              planProgress: cumulativeTarget > 0 ? ((cumulativeWRVUs + cumulativeAdjustments) / cumulativeTarget) * 100 : 0
            }
          });

          allResults.push(metrics);
          return metrics;
        } catch (error) {
          console.error('Error processing provider metrics:', error);
          return null;
        }
      }));

      const validResults = monthResults.filter(result => result !== null);
      console.log(`Processed ${validResults.length} providers for ${currentYear}-${currentMonth}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${allResults.length} provider metrics records`,
      count: allResults.length
    });
  } catch (error) {
    console.error('Error in metrics calculation:', error);
    return NextResponse.json(
      { error: 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
} 