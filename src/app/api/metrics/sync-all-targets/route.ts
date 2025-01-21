import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    console.log('Starting sync-all-targets process...');
    const currentYear = new Date().getFullYear();

    // Get all providers with their metrics data
    console.log('Fetching providers and their metrics...');
    const providers = await prisma.provider.findMany({
      include: {
        metrics: {
          where: { 
            year: currentYear
          },
          orderBy: {
            month: 'asc'
          }
        },
        wrvuAdjustments: {
          where: {
            year: currentYear
          }
        }
      }
    });
    console.log(`Found ${providers.length} providers`);

    const updates = await Promise.all(providers.map(async (provider) => {
      try {
        console.log(`Processing provider ${provider.id} (${provider.firstName} ${provider.lastName})`);
        
        // Get the monthly metrics and incentives
        const monthlyMetrics = provider.metrics.map(metric => {
          // Find incentives for this month
          const monthIncentives = provider.wrvuAdjustments.find(adj => adj.month === metric.month);
          const incentiveAmount = monthIncentives?.value || 0;
          const holdbackAmount = incentiveAmount * 0.28; // 28% holdback
          const netIncentives = incentiveAmount - holdbackAmount;

          return {
            month: metric.month,
            targetWRVUs: metric.targetWRVUs,
            cumulativeTarget: metric.cumulativeTarget,
            incentivesEarned: incentiveAmount,
            holdbackAmount: holdbackAmount,
            netIncentives: netIncentives
          };
        });

        // Update metrics for each month
        console.log(`Updating metrics for provider ${provider.id}...`);
        const providerUpdates = await Promise.all(monthlyMetrics.map(async metrics => {
          try {
            return await prisma.providerMetrics.update({
              where: {
                providerId_year_month: {
                  providerId: provider.id,
                  year: currentYear,
                  month: metrics.month
                }
              },
              data: {
                targetWRVUs: metrics.targetWRVUs,
                cumulativeTarget: metrics.cumulativeTarget,
                incentivesEarned: metrics.incentivesEarned,
                holdbackAmount: metrics.holdbackAmount,
                totalCompensation: provider.baseSalary / 12 + metrics.netIncentives
              }
            });
          } catch (error) {
            console.error(`Error updating metrics for provider ${provider.id}, month ${metrics.month}:`, error);
            return null;
          }
        }));

        const successfulMonthUpdates = providerUpdates.filter(Boolean);
        console.log(`Successfully updated ${successfulMonthUpdates.length} months for provider ${provider.id}`);

        return {
          providerId: provider.id,
          name: `${provider.firstName} ${provider.lastName}`,
          updatedMonths: successfulMonthUpdates.length,
          sampleMetrics: monthlyMetrics.slice(0, 2) // Log first two months for verification
        };
      } catch (error) {
        console.error(`Error processing provider ${provider.id}:`, error);
        return null;
      }
    }));

    const successfulUpdates = updates.filter(Boolean);
    console.log(`Completed processing. Successfully updated ${successfulUpdates.length} providers`);
    
    // Log sample metrics for verification
    console.log('Sample metrics for first 3 providers:', 
      successfulUpdates
        .slice(0, 3)
        .map(update => ({
          name: update?.name,
          metrics: update?.sampleMetrics
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
        error: 'Failed to sync metrics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 