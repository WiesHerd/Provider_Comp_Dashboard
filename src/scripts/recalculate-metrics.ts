const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateMetrics() {
  try {
    // Get all providers with their metrics and adjustments
    const providers = await prisma.provider.findMany({
      where: {
        status: 'Active'
      },
      include: {
        metrics: true,
        wrvuAdjustments: true,
        targetAdjustments: true
      }
    });

    console.log(`Found ${providers.length} active providers`);

    // Get market data for conversion factors
    const marketData = await prisma.marketData.findMany();
    console.log(`Found ${marketData.length} market data records`);

    let updatedCount = 0;

    for (const provider of providers) {
      // Get conversion factor for provider's specialty
      const matchingMarket = marketData.find(m => m.specialty === provider.specialty);
      if (!matchingMarket) {
        console.warn(`No market data found for provider ${provider.id} with specialty ${provider.specialty}`);
        continue;
      }

      const conversionFactor = matchingMarket.p50_cf;
      if (!conversionFactor) {
        console.warn(`No conversion factor found for provider ${provider.id}`);
        continue;
      }

      // Initialize cumulative trackers for this provider
      let cumulativeWRVUs = 0;
      let cumulativeTarget = 0;

      // Sort metrics by year and month
      const sortedMetrics = provider.metrics.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      // Update each metric for the provider
      for (const metric of sortedMetrics) {
        // Get WRVU adjustments for this month/year
        const wrvuAdjustments = provider.wrvuAdjustments.filter(adj => 
          adj.year === metric.year && adj.month === metric.month
        );
        const totalWRVUAdjustments = wrvuAdjustments.reduce((sum, adj) => sum + adj.value, 0);

        // Get target adjustments for this month/year
        const targetAdjustments = provider.targetAdjustments.filter(adj => 
          adj.year === metric.year && adj.month === metric.month
        );
        const totalTargetAdjustments = targetAdjustments.reduce((sum, adj) => sum + adj.value, 0);

        // Calculate total actual WRVUs (including adjustments)
        const totalActualWRVUs = (metric.rawMonthlyWRVUs || 0) + totalWRVUAdjustments;
        
        // Calculate total target (including adjustments)
        const totalTarget = (metric.targetWRVUs || 0) + totalTargetAdjustments;

        // Update cumulative values
        cumulativeWRVUs += totalActualWRVUs;
        cumulativeTarget += totalTarget;

        // Calculate variance using adjusted values
        const variance = totalActualWRVUs - totalTarget;
        const incentiveAmount = variance > 0 ? variance * conversionFactor : 0;
        
        // Calculate holdback amount (default 20% if no settings)
        const holdbackAmount = incentiveAmount * 0.20;

        // Calculate plan progress
        const planProgress = totalTarget > 0 ? (totalActualWRVUs / totalTarget) * 100 : 0;

        // Calculate percentiles based on market data
        const annualizedWRVUs = totalActualWRVUs * (12 / metric.month);
        const wrvuPercentile = calculatePercentile(annualizedWRVUs, [
          matchingMarket.p25_wrvu,
          matchingMarket.p50_wrvu,
          matchingMarket.p75_wrvu,
          matchingMarket.p90_wrvu
        ]);

        // Calculate total compensation and percentile
        const monthlyBaseSalary = (provider.baseSalary || 0) / 12;
        const totalComp = monthlyBaseSalary + incentiveAmount;
        const annualizedComp = totalComp * 12;
        const compPercentile = calculatePercentile(annualizedComp, [
          matchingMarket.p25_total,
          matchingMarket.p50_total,
          matchingMarket.p75_total,
          matchingMarket.p90_total
        ]);

        console.log(`Processing ${provider.firstName} ${provider.lastName} - ${metric.year}/${metric.month}:`, {
          rawMonthlyWRVUs: metric.rawMonthlyWRVUs,
          adjustments: totalWRVUAdjustments,
          actualWRVUs: totalActualWRVUs,
          targetWRVUs: totalTarget,
          variance,
          incentiveAmount,
          holdbackAmount,
          planProgress,
          wrvuPercentile,
          compPercentile
        });

        await prisma.providerMetrics.update({
          where: { id: metric.id },
          data: { 
            actualWRVUs: totalActualWRVUs,
            rawMonthlyWRVUs: metric.rawMonthlyWRVUs || 0,
            cumulativeWRVUs,
            targetWRVUs: totalTarget,
            cumulativeTarget,
            baseSalary: monthlyBaseSalary,
            totalCompensation: totalComp,
            incentivesEarned: incentiveAmount,
            holdbackAmount: holdbackAmount,
            wrvuPercentile,
            compPercentile,
            planProgress,
            monthsCompleted: metric.month
          }
        });

        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} metrics records`);
  } catch (error) {
    console.error('Error updating metrics:', error);
    throw error;
  }
}

// Helper function to calculate percentile
function calculatePercentile(value: number, benchmarks: number[]): number {
  if (value <= benchmarks[0]) return 25;
  if (value <= benchmarks[1]) return 25 + (50 - 25) * (value - benchmarks[0]) / (benchmarks[1] - benchmarks[0]);
  if (value <= benchmarks[2]) return 50 + (75 - 50) * (value - benchmarks[1]) / (benchmarks[2] - benchmarks[1]);
  if (value <= benchmarks[3]) return 75 + (90 - 75) * (value - benchmarks[2]) / (benchmarks[3] - benchmarks[2]);
  return 90;
}

// Run the recalculation
recalculateMetrics()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 