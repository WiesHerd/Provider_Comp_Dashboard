const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCumulativeMetrics() {
  try {
    console.log('Starting cumulative metrics update...');

    // Get all active providers
    const providers = await prisma.provider.findMany({
      where: { status: 'Active' },
      include: {
        metrics: {
          orderBy: [
            { year: 'asc' },
            { month: 'asc' }
          ]
        },
        wrvuAdjustments: true,
        targetAdjustments: true
      }
    });

    console.log(`Found ${providers.length} active providers`);

    for (const provider of providers) {
      console.log(`\nProcessing provider: ${provider.firstName} ${provider.lastName}`);
      
      let yearlyWRVUs = 0;
      let yearlyTarget = 0;

      // Group metrics by year
      const metricsByYear = provider.metrics.reduce((acc, metric) => {
        if (!acc[metric.year]) {
          acc[metric.year] = [];
        }
        acc[metric.year].push(metric);
        return acc;
      }, {});

      // Process each year separately
      for (const year in metricsByYear) {
        console.log(`\nProcessing year ${year}`);
        yearlyWRVUs = 0;
        yearlyTarget = 0;

        // Sort metrics by month
        const yearMetrics = metricsByYear[year].sort((a, b) => a.month - b.month);

        for (const metric of yearMetrics) {
          // Get WRVU adjustments for this month
          const wrvuAdjustments = provider.wrvuAdjustments
            .filter(adj => adj.year === metric.year && adj.month === metric.month)
            .reduce((sum, adj) => sum + adj.value, 0);

          // Get target adjustments for this month
          const targetAdjustments = provider.targetAdjustments
            .filter(adj => adj.year === metric.year && adj.month === metric.month)
            .reduce((sum, adj) => sum + adj.value, 0);

          // Calculate total actual WRVUs for the month
          const monthlyWRVUs = metric.rawMonthlyWRVUs + wrvuAdjustments;
          yearlyWRVUs += monthlyWRVUs;

          // Calculate total target for the month (using targetWRVUs instead of annualWRVUTarget)
          const monthlyTarget = (provider.targetWRVUs / 12) + targetAdjustments;
          yearlyTarget += monthlyTarget;

          console.log(`Month ${metric.month}:
            Raw Monthly WRVUs: ${metric.rawMonthlyWRVUs}
            WRVU Adjustments: ${wrvuAdjustments}
            Total Monthly WRVUs: ${monthlyWRVUs}
            Monthly Target: ${monthlyTarget}
            Cumulative WRVUs: ${yearlyWRVUs}
            Cumulative Target: ${yearlyTarget}`);

          // Update the metric record
          await prisma.providerMetrics.update({
            where: {
              id: metric.id
            },
            data: {
              actualWRVUs: monthlyWRVUs,
              cumulativeWRVUs: yearlyWRVUs,
              targetWRVUs: monthlyTarget,
              cumulativeTarget: yearlyTarget
            }
          });
        }
      }
    }

    console.log('\nFinished updating cumulative metrics');
  } catch (error) {
    console.error('Error updating cumulative metrics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCumulativeMetrics(); 