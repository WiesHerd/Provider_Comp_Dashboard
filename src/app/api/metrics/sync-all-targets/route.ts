import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to get monthly salaries with prorations
function getMonthlySalaries(
  baseAnnualSalary: number,
  baseFTE: number,
  compensationChanges: any[]
) {
  const sortedChanges = [...compensationChanges].sort((a, b) => 
    new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
  );

  let currentAnnualSalary = sortedChanges.length > 0 ? sortedChanges[0].previousSalary : baseAnnualSalary;
  let currentFTE = sortedChanges.length > 0 ? (sortedChanges[0].previousFTE || baseFTE) : baseFTE;
  
  const monthlySalaries: Record<string, number> = {};
  const year = new Date().getFullYear();
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  for (let i = 0; i < 12; i++) {
    const monthKey = months[i];
    const monthlyChanges = sortedChanges.filter(ch => {
      const effDate = new Date(ch.effectiveDate);
      return effDate.getMonth() === i;
    });

    if (monthlyChanges.length === 0) {
      monthlySalaries[monthKey] = currentAnnualSalary / 12;
      continue;
    }

    // Handle the change for this month
    const change = monthlyChanges[0];
    const changeDate = new Date(change.effectiveDate);
    const dayOfChange = changeDate.getDate();
    const daysInMonth = new Date(year, i + 1, 0).getDate();

    const oldAnnual = currentAnnualSalary;
    const newAnnual = change.newSalary;

    if (dayOfChange === 1) {
      // Entire month at new salary
      monthlySalaries[monthKey] = newAnnual / 12;
    } else {
      // Prorate the month based on days
      const oldDays = dayOfChange - 1;
      const newDays = daysInMonth - oldDays;
      
      const oldMonthlyAmount = (oldAnnual / 12) * (oldDays / daysInMonth);
      const newMonthlyAmount = (newAnnual / 12) * (newDays / daysInMonth);
      monthlySalaries[monthKey] = oldMonthlyAmount + newMonthlyAmount;
    }

    // Update current values for future months
    currentAnnualSalary = newAnnual;
    currentFTE = change.newFTE ?? currentFTE;
  }

  return monthlySalaries;
}

export async function POST(request: Request) {
  try {
    console.log('Starting sync-all-targets process...');
    const currentYear = new Date().getFullYear();

    // Get all providers with their compensation changes and target adjustments
    console.log('Fetching providers...');
    const providers = await prisma.provider.findMany({
      include: {
        targetAdjustments: {
          where: { year: currentYear }
        },
        compensationChanges: {
          where: { 
            effectiveDate: {
              gte: new Date(currentYear, 0, 1),
              lte: new Date(currentYear, 11, 31)
            }
          },
          orderBy: { effectiveDate: 'asc' }
        }
      }
    });
    console.log(`Found ${providers.length} providers`);

    // Get market data for conversion factors
    console.log('Fetching market data...');
    const marketData = await prisma.marketData.findMany();
    console.log(`Found ${marketData.length} market data entries`);

    const updates = await Promise.all(providers.map(async (provider) => {
      try {
        console.log(`Processing provider ${provider.id} (${provider.firstName} ${provider.lastName})`);
        
        // Get conversion factor from market data
        const matchingMarket = marketData.find(data => data.specialty === provider.specialty);
        if (!matchingMarket) {
          console.warn(`No market data found for specialty: ${provider.specialty}`);
          return null;
        }

        const conversionFactor = matchingMarket.p50_cf;
        if (!conversionFactor || conversionFactor <= 0) {
          console.warn(`Invalid conversion factor for provider ${provider.id}: ${conversionFactor}`);
          return null;
        }

        // Get monthly base salaries (handles prorations)
        const monthlySalaries = getMonthlySalaries(
          provider.baseSalary,
          provider.fte,
          provider.compensationChanges
        );

        // Calculate targets for each month
        const monthlyTargets = Object.entries(monthlySalaries).map(([monthKey, monthlySalary], index) => {
          const month = index + 1;
          
          // Calculate base target from monthly salary
          const baseMonthlyTarget = monthlySalary / conversionFactor;

          // Get adjustments for this month
          const monthAdjustments = provider.targetAdjustments
            .reduce((sum, adj) => sum + (Number(adj[monthKey as keyof typeof adj]) || 0), 0);

          // Calculate monthly target with adjustments
          const monthlyTargetWithAdjustments = baseMonthlyTarget + monthAdjustments;

          // Calculate cumulative target up to this month
          const cumulativeTarget = Object.entries(monthlySalaries)
            .slice(0, index + 1)
            .reduce((sum, [prevMonthKey, prevMonthlySalary]) => {
              const prevBaseTarget = prevMonthlySalary / conversionFactor;
              const prevAdjustments = provider.targetAdjustments
                .reduce((adjSum, adj) => adjSum + (Number(adj[prevMonthKey as keyof typeof adj]) || 0), 0);
              return sum + prevBaseTarget + prevAdjustments;
            }, 0);

          return {
            month,
            targetWRVUs: monthlyTargetWithAdjustments,
            cumulativeTarget
          };
        });

        // Update metrics for each month
        console.log(`Updating metrics for provider ${provider.id}...`);
        const providerUpdates = await Promise.all(monthlyTargets.map(async target => {
          try {
            const existingMetric = await prisma.providerMetrics.findUnique({
              where: {
                providerId_year_month: {
                  providerId: provider.id,
                  year: currentYear,
                  month: target.month
                }
              }
            });

            if (existingMetric) {
              return await prisma.providerMetrics.update({
                where: {
                  providerId_year_month: {
                    providerId: provider.id,
                    year: currentYear,
                    month: target.month
                  }
                },
                data: {
                  targetWRVUs: target.targetWRVUs,
                  cumulativeTarget: target.cumulativeTarget
                }
              });
            } else {
              return await prisma.providerMetrics.create({
                data: {
                  providerId: provider.id,
                  year: currentYear,
                  month: target.month,
                  targetWRVUs: target.targetWRVUs,
                  cumulativeTarget: target.cumulativeTarget,
                  actualWRVUs: 0,
                  rawMonthlyWRVUs: 0,
                  cumulativeWRVUs: 0,
                  baseSalary: monthlySalaries[Object.keys(monthlySalaries)[target.month - 1]],
                  totalCompensation: 0,
                  incentivesEarned: 0,
                  holdbackAmount: 0,
                  wrvuPercentile: 0,
                  compPercentile: 0,
                  planProgress: 0,
                  monthsCompleted: target.month
                }
              });
            }
          } catch (error) {
            console.error(`Error updating metrics for provider ${provider.id}, month ${target.month}:`, error);
            return null;
          }
        }));

        const successfulMonthUpdates = providerUpdates.filter(Boolean);
        console.log(`Successfully updated ${successfulMonthUpdates.length} months for provider ${provider.id}`);

        return {
          providerId: provider.id,
          name: `${provider.firstName} ${provider.lastName}`,
          updatedMonths: successfulMonthUpdates.length,
          sampleTargets: monthlyTargets.slice(0, 2) // Log first two months for verification
        };
      } catch (error) {
        console.error(`Error processing provider ${provider.id}:`, error);
        return null;
      }
    }));

    const successfulUpdates = updates.filter(Boolean);
    console.log(`Completed processing. Successfully updated ${successfulUpdates.length} providers`);
    
    // Log sample targets for verification
    console.log('Sample targets for first 3 providers:', 
      successfulUpdates
        .slice(0, 3)
        .map(update => ({
          name: update?.name,
          targets: update?.sampleTargets
        }))
    );

    return NextResponse.json({
      success: true,
      providersUpdated: successfulUpdates.length,
      details: successfulUpdates
    });
  } catch (error) {
    console.error('Error in sync-all-targets:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync target wRVUs',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 