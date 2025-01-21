const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMarketData() {
  try {
    // Get market data for Cardiothoracic Surgery
    const marketData = await prisma.marketData.findFirst({
      where: {
        specialty: 'Cardiothoracic Surgery'
      }
    });

    console.log('Market Data for Cardiothoracic Surgery:');
    console.log('WRVU Benchmarks:');
    console.log(`25th percentile: ${marketData?.p25_wrvu}`);
    console.log(`50th percentile: ${marketData?.p50_wrvu}`);
    console.log(`75th percentile: ${marketData?.p75_wrvu}`);
    console.log(`90th percentile: ${marketData?.p90_wrvu}`);

    // Get Cinthia Brooks's latest metrics
    const metrics = await prisma.providerMetrics.findFirst({
      where: {
        provider: {
          firstName: 'Cinthia',
          lastName: 'Brooks'
        },
        year: 2024,
        month: 12
      },
      include: {
        provider: true
      }
    });

    if (metrics) {
      console.log('\nCinthia Brooks Metrics (December 2024):');
      console.log(`YTD WRVUs: ${metrics.ytdWRVUs}`);
      console.log(`WRVU Percentile: ${metrics.wrvuPercentile}`);
      console.log(`FTE: ${metrics.provider.fte}`);
    }

  } catch (error) {
    console.error('Error checking market data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMarketData(); 