const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMetrics() {
  try {
    // Get metrics and market data
    const metrics = await prisma.providerMetrics.findMany({
      where: {
        year: 2024,
        month: 1
      },
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
            fte: true
          }
        }
      }
    });

    const marketData = await prisma.marketData.findMany();

    console.log(`Found ${metrics.length} metrics records for January 2024`);
    
    // Log details for first 5 records
    metrics.slice(0, 5).forEach(metric => {
      const providerMarketData = marketData.find(m => m.specialty === metric.provider.specialty);
      
      console.log(`\nProvider: ${metric.provider.firstName} ${metric.provider.lastName} (${metric.provider.specialty})`);
      console.log(`FTE: ${metric.provider.fte}`);
      console.log(`Monthly WRVUs: ${metric.actualWRVUs}`);
      console.log(`Annualized WRVUs: ${metric.actualWRVUs * 12}`);
      if (providerMarketData) {
        console.log(`Market WRVU Benchmarks (${metric.provider.specialty}):`);
        console.log(`  p90: ${providerMarketData.p90_wrvu}`);
        console.log(`  p75: ${providerMarketData.p75_wrvu}`);
        console.log(`  p50: ${providerMarketData.p50_wrvu}`);
        console.log(`  p25: ${providerMarketData.p25_wrvu}`);
      }
      console.log(`WRVU Percentile: ${metric.wrvuPercentile}`);
      
      console.log(`Monthly Compensation: ${metric.totalCompensation}`);
      console.log(`Annualized Compensation: ${metric.totalCompensation * 12}`);
      if (providerMarketData) {
        console.log(`Market Comp Benchmarks (${metric.provider.specialty}):`);
        console.log(`  p90: ${providerMarketData.p90_total}`);
        console.log(`  p75: ${providerMarketData.p75_total}`);
        console.log(`  p50: ${providerMarketData.p50_total}`);
        console.log(`  p25: ${providerMarketData.p25_total}`);
      }
      console.log(`Comp Percentile: ${metric.compPercentile}`);
    });

  } catch (error) {
    console.error('Error checking metrics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMetrics(); 