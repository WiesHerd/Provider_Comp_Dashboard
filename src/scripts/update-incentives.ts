const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateIncentives() {
  try {
    console.log('Starting incentive calculations...');

    // Get all active providers with their metrics and settings
    const providers = await prisma.provider.findMany({
      where: { status: 'Active' },
      include: {
        metrics: true,
        wrvuAdjustments: true,
        targetAdjustments: true,
        settings: true
      }
    });
    console.log(`Found ${providers.length} active providers`);

    // Get all market data
    const marketData = await prisma.marketData.findMany();
    console.log(`Found ${marketData.length} market data records`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const provider of providers) {
      console.log(`\nProcessing provider: ${provider.firstName} ${provider.lastName} (${provider.specialty})`);
      console.log(`Metrics count: ${provider.metrics.length}`);
      
      // Find matching market data for provider's specialty
      const providerMarketData = marketData.find(m => m.specialty === provider.specialty);
      
      if (!providerMarketData) {
        console.log(`No market data found for provider ${provider.id} with specialty ${provider.specialty}`);
        skippedCount++;
        continue;
      }

      if (!providerMarketData.p50_cf) {
        console.log(`No conversion factor found for provider ${provider.id}`);
        skippedCount++;
        continue;
      }

      // Process each metric for the provider
      for (const metric of provider.metrics) {
        console.log(`\nProcessing metric for ${metric.year}/${metric.month}:`);
        console.log(`Raw Monthly WRVUs: ${metric.rawMonthlyWRVUs}`);
        
        // Calculate total actual WRVUs including adjustments
        const wrvuAdjustments = provider.wrvuAdjustments
          .filter(adj => adj.month === metric.month && adj.year === metric.year)
          .reduce((sum, adj) => sum + adj.value, 0);
        
        console.log(`WRVU Adjustments: ${wrvuAdjustments}`);
        
        const totalActualWRVUs = metric.rawMonthlyWRVUs + wrvuAdjustments;
        console.log(`Total Actual WRVUs: ${totalActualWRVUs}`);

        // Calculate total target including adjustments
        const targetAdjustments = provider.targetAdjustments
          .filter(adj => adj.month === metric.month && adj.year === metric.year)
          .reduce((sum, adj) => sum + adj.value, 0);
        
        console.log(`Target Adjustments: ${targetAdjustments}`);
        
        const totalTarget = metric.targetWRVUs + targetAdjustments;
        console.log(`Total Target: ${totalTarget}`);

        // Calculate variance and incentive
        const variance = totalActualWRVUs - totalTarget;
        console.log(`Variance: ${variance}`);
        console.log(`Conversion Factor: ${providerMarketData.p50_cf}`);
        
        const incentiveAmount = variance > 0 ? variance * providerMarketData.p50_cf : 0;
        console.log(`Incentive Amount: ${incentiveAmount}`);

        // Get holdback percentage (default to 20% if no settings)
        const holdbackPercent = provider.settings?.holdbackPercent ?? 20;
        console.log(`Holdback Percentage: ${holdbackPercent}%`);

        // Calculate plan progress
        const planProgress = totalTarget > 0 ? (totalActualWRVUs / totalTarget) * 100 : 0;
        console.log(`Plan Progress: ${planProgress}%`);

        // Update the metric with new calculations
        await prisma.providerMetrics.update({
          where: { id: metric.id },
          data: {
            actualWRVUs: totalActualWRVUs,
            targetWRVUs: totalTarget,
            incentivesEarned: incentiveAmount,
            holdbackAmount: incentiveAmount * (holdbackPercent / 100),
            planProgress
          }
        });

        updatedCount++;
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} metrics records`);
    console.log(`Skipped ${skippedCount} providers due to missing data`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateIncentives(); 