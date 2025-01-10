import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

interface ProviderResult {
  providerId: string;
  name: string;
  monthsUpdated: number;
  baseMonthlyTarget: number;
  sampleCalculations?: {
    baseSalary: number;
    conversionFactor: number;
    clinicalFte: number;
    monthlyTarget: number;
    adjustments: number;
    finalTarget: number;
  };
}

function calculateMonthlyTarget(annualSalary: number, conversionFactor: number, fte: number = 1.0) {
  if (!annualSalary || annualSalary <= 0) {
    console.error('Invalid annual salary:', annualSalary);
    return 0;
  }
  
  if (!conversionFactor || conversionFactor <= 0) {
    console.error('Invalid conversion factor:', conversionFactor);
    return 0;
  }
  
  if (!fte || fte <= 0) {
    console.error('Invalid FTE:', fte);
    return 0;
  }

  console.log('\nCalculating monthly target with inputs:', {
    annualSalary,
    conversionFactor,
    fte
  });
  
  // Calculate annual target wRVUs
  const annualTarget = (annualSalary / conversionFactor);
  console.log('Annual target wRVUs:', annualTarget);
  
  // Calculate monthly target
  const monthlyTarget = (annualTarget / 12) * fte;
  console.log('Final monthly target:', monthlyTarget);
  
  return monthlyTarget;
}

export async function POST() {
  try {
    console.log('\n=== Starting mass target calculation ===\n');
    const currentYear = 2024;

    // Get all active providers with their target adjustments and market data
    const providers = await prisma.provider.findMany({
      where: {
        status: 'Active'
      },
      include: {
        targetAdjustments: {
          where: { year: currentYear }
        }
      }
    });

    const marketData = await prisma.marketData.findMany();
    
    console.log(`Found ${providers.length} active providers and ${marketData.length} market data entries`);

    let successCount = 0;
    const results: ProviderResult[] = [];

    // Process each provider
    for (const provider of providers) {
      try {
        console.log(`\n=== Processing provider: ${provider.firstName} ${provider.lastName} ===`);
        console.log('Provider details:', {
          id: provider.id,
          specialty: provider.specialty,
          baseSalary: provider.baseSalary,
          clinicalFte: provider.clinicalFte
        });
        
        // Validate provider data
        if (!provider.specialty) {
          console.error(`Provider ${provider.id} has no specialty defined`);
          continue;
        }

        if (!provider.baseSalary || provider.baseSalary <= 0) {
          console.error(`Provider ${provider.id} has invalid base salary: ${provider.baseSalary}`);
          continue;
        }

        if (!provider.clinicalFte || provider.clinicalFte <= 0) {
          console.error(`Provider ${provider.id} has invalid clinical FTE: ${provider.clinicalFte}`);
          continue;
        }

        // Get conversion factor from market data
        const matchingMarket = marketData.find(data => 
          data.specialty.toLowerCase() === provider.specialty.toLowerCase()
        );
        
        if (!matchingMarket) {
          console.error(`No market data found for specialty: ${provider.specialty}`);
          continue;
        }

        const conversionFactor = matchingMarket.p50_cf;
        if (!conversionFactor || conversionFactor <= 0) {
          console.error(`Invalid conversion factor for provider ${provider.id}: ${conversionFactor}`);
          continue;
        }

        console.log('Market data found:', {
          specialty: provider.specialty,
          conversionFactor,
          p50_wrvu: matchingMarket.p50_wrvu
        });

        // Calculate base monthly target
        const baseMonthlyTarget = calculateMonthlyTarget(
          provider.baseSalary,
          conversionFactor,
          provider.clinicalFte
        );

        if (baseMonthlyTarget <= 0) {
          console.error(`Invalid base monthly target calculated for provider ${provider.id}: ${baseMonthlyTarget}`);
          continue;
        }

        console.log(`Base calculations for ${provider.firstName} ${provider.lastName}:`, {
          baseSalary: provider.baseSalary,
          conversionFactor,
          clinicalFte: provider.clinicalFte,
          baseMonthlyTarget
        });

        // Process each month
        for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
          const month = monthIndex + 1;

          // Get target adjustments for this month
          const monthlyAdjustments = provider.targetAdjustments
            .filter(adj => adj.month === month)
            .reduce((sum, adj) => sum + Number(adj.value || 0), 0);

          // Calculate target with adjustments
          const monthlyTargetWithAdjustments = baseMonthlyTarget + monthlyAdjustments;

          // Calculate cumulative target including all adjustments up to this month
          const cumulativeTarget = (baseMonthlyTarget * month) + 
            provider.targetAdjustments
              .filter(adj => adj.month <= month)
              .reduce((sum, adj) => sum + Number(adj.value || 0), 0);

          console.log(`Month ${month} calculations:`, {
            baseMonthlyTarget,
            monthlyAdjustments,
            monthlyTargetWithAdjustments,
            cumulativeTarget
          });

          // Get existing metrics for this provider and month
          const existingMetrics = await prisma.providerMetrics.findUnique({
            where: {
              providerId_year_month: {
                providerId: provider.id,
                year: currentYear,
                month: month
              }
            }
          });

          // Update or create metrics record
          const updatedMetrics = await prisma.providerMetrics.upsert({
            where: {
              providerId_year_month: {
                providerId: provider.id,
                year: currentYear,
                month: month
              }
            },
            update: {
              targetWRVUs: monthlyTargetWithAdjustments,
              cumulativeTarget: cumulativeTarget,
              baseSalary: provider.baseSalary || 0,
              totalCompensation: provider.baseSalary / 12 || 0,
              planProgress: cumulativeTarget > 0 ? ((existingMetrics?.cumulativeWRVUs || 0) / cumulativeTarget) * 100 : 0
            },
            create: {
              providerId: provider.id,
              year: currentYear,
              month: month,
              targetWRVUs: monthlyTargetWithAdjustments,
              cumulativeTarget: cumulativeTarget,
              actualWRVUs: 0,
              rawMonthlyWRVUs: 0,
              cumulativeWRVUs: 0,
              baseSalary: provider.baseSalary || 0,
              totalCompensation: provider.baseSalary / 12 || 0,
              incentivesEarned: 0,
              holdbackAmount: 0,
              wrvuPercentile: 0,
              compPercentile: 0,
              planProgress: 0,
              monthsCompleted: month
            }
          });

          console.log(`Updated metrics for month ${month}:`, {
            targetWRVUs: updatedMetrics.targetWRVUs,
            cumulativeTarget: updatedMetrics.cumulativeTarget,
            baseSalary: updatedMetrics.baseSalary
          });
        }

        successCount++;
        results.push({
          providerId: provider.id,
          name: `${provider.firstName} ${provider.lastName}`,
          monthsUpdated: 12,
          baseMonthlyTarget,
          sampleCalculations: {
            baseSalary: provider.baseSalary,
            conversionFactor,
            clinicalFte: provider.clinicalFte,
            monthlyTarget: baseMonthlyTarget,
            adjustments: provider.targetAdjustments.reduce((sum, adj) => sum + Number(adj.value || 0), 0),
            finalTarget: baseMonthlyTarget
          }
        });

      } catch (error) {
        console.error(`Error processing provider ${provider.id}:`, error);
      }
    }

    console.log(`\n=== Completed target calculations ===`);
    console.log(`Successfully updated ${successCount} providers`);
    
    if (results.length > 0) {
      console.log('\nSample calculations for first provider:', results[0].sampleCalculations);
    }
    
    return NextResponse.json({
      success: true,
      providersUpdated: successCount,
      details: results
    });

  } catch (error) {
    console.error('Error in calculate-all-targets:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate targets',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 