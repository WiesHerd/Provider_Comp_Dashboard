import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function getProviderHoldbackPercentage(providerId: string): Promise<number> {
  try {
    // First try to get provider-specific holdback
    const providerConfig = await prisma.providerSettings.findFirst({
      where: { providerId }
    });
    
    if (providerConfig?.holdbackPercent) {
      return providerConfig.holdbackPercent;
    }

    // Fall back to system default
    const systemConfig = await prisma.systemConfig.findFirst({
      where: { key: 'default_holdback' }
    });

    return systemConfig?.value ? parseFloat(systemConfig.value) : 20; // Default to 20% if no config found
  } catch (error) {
    console.error(`Error getting holdback percentage for provider ${providerId}:`, error);
    return 20; // Default to 20% on error
  }
}

export async function POST(request: Request) {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    
    // Get all providers with their metrics and market data
    const providers = await prisma.provider.findMany({
      where: {
        status: 'Active'
      },
      include: {
        metrics: {
          where: {
            year
          }
        }
      }
    });

    console.log(`Found ${providers.length} active providers`);

    // Get market data separately
    const marketData = await prisma.marketData.findMany();
    console.log(`Found ${marketData.length} market data records`);

    const updates = await Promise.all(providers.map(async (provider) => {
      try {
        console.log(`\nProcessing provider ${provider.id} (${provider.firstName} ${provider.lastName})`);
        console.log(`Provider has ${provider.metrics.length} metrics records for ${year}`);
        
        // Get the matching market data for conversion factor
        const matchingMarket = marketData.find(m => m.specialty === provider.specialty);
        if (!matchingMarket) {
          console.warn(`No market data found for provider ${provider.id} with specialty ${provider.specialty}`);
          return null;
        }

        const conversionFactor = matchingMarket.p50_cf || 0;
        if (!conversionFactor) {
          console.warn(`No conversion factor found for provider ${provider.id}`);
          return null;
        }

        // Get provider's holdback percentage
        const holdbackPercentage = await getProviderHoldbackPercentage(provider.id);

        console.log(`Using conversion factor: ${conversionFactor} for specialty ${provider.specialty}`);
        console.log(`Using holdback percentage: ${holdbackPercentage}%`);

        // Calculate monthly metrics
        const monthlyMetrics = provider.metrics.map(metric => {
          // Calculate variance between actual and target WRVUs
          const variance = (metric.actualWRVUs || 0) - (metric.targetWRVUs || 0);
          
          // Calculate incentive (only if variance is positive)
          const incentiveAmount = variance > 0 ? variance * conversionFactor : 0;
          const holdbackAmount = incentiveAmount * (holdbackPercentage / 100);

          console.log(`\nMonth ${metric.month} calculations for ${provider.firstName} ${provider.lastName}:`, {
            actualWRVUs: metric.actualWRVUs,
            targetWRVUs: metric.targetWRVUs,
            variance,
            conversionFactor,
            incentiveAmount,
            holdbackAmount
          });

          // Update the metric record
          return prisma.providerMetrics.update({
            where: {
              id: metric.id
            },
            data: {
              incentivesEarned: incentiveAmount,
              holdbackAmount: holdbackAmount
            }
          });
        });

        // Execute all updates for this provider
        const results = await Promise.all(monthlyMetrics);
        console.log(`Updated ${results.length} metrics records for provider ${provider.id}`);
        return results;

      } catch (error) {
        console.error(`Error processing provider ${provider.id}:`, error);
        return null;
      }
    }));

    const successfulUpdates = updates.filter(Boolean).flat();
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${successfulUpdates.length} metrics records`,
      updatedRecords: successfulUpdates.length
    });

  } catch (error) {
    console.error('Error in sync-all-incentives:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync incentives' },
      { status: 500 }
    );
  }
} 