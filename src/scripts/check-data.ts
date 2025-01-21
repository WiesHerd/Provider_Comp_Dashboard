const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Get Cinthia Brooks's metrics
    const metrics = await prisma.providerMetrics.findMany({
      where: {
        provider: {
          firstName: 'Cinthia',
          lastName: 'Brooks'
        },
        year: 2024
      },
      include: {
        provider: true
      },
      orderBy: {
        month: 'asc'
      }
    });

    console.log('Cinthia Brooks Metrics:');
    metrics.forEach(metric => {
      console.log(`\nMonth ${metric.month}:`);
      console.log(`YTD WRVUs: ${metric.ytdWRVUs}`);
      console.log(`WRVU Percentile: ${metric.wrvuPercentile}`);
      console.log(`FTE: ${metric.provider.fte}`);
    });

    // Get market data for Cardiothoracic Surgery
    const marketData = await prisma.marketData.findFirst({
      where: {
        specialty: 'Cardiothoracic Surgery'
      }
    });

    console.log('\nCardiothoracic Surgery Market Data:');
    console.log('WRVU Benchmarks:');
    console.log(`25th percentile: ${marketData?.p25_wrvu}`);
    console.log(`50th percentile: ${marketData?.p50_wrvu}`);
    console.log(`75th percentile: ${marketData?.p75_wrvu}`);
    console.log(`90th percentile: ${marketData?.p90_wrvu}`);

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 