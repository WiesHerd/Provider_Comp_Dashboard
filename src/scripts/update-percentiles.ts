const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateWRVUPercentile(actualWRVUs: number, monthsCompleted: number, fte: number, marketData: any): number {
  if (!marketData || !marketData.p25_wrvu) {
    return 0;
  }

  // Annualize wRVUs
  const annualizedWRVUs = monthsCompleted > 0 
    ? (actualWRVUs / monthsCompleted) * 12 
    : 0;

  // Adjust for FTE
  const fteAdjustedWRVUs = fte < 1.0 
    ? annualizedWRVUs / fte 
    : annualizedWRVUs;

  const benchmarks = [
    { percentile: 25, value: marketData.p25_wrvu },
    { percentile: 50, value: marketData.p50_wrvu },
    { percentile: 75, value: marketData.p75_wrvu },
    { percentile: 90, value: marketData.p90_wrvu }
  ];

  console.log('\nWRVU Percentile Calculation:');
  console.log(`Actual WRVUs: ${actualWRVUs}`);
  console.log(`Months Completed: ${monthsCompleted}`);
  console.log(`FTE: ${fte}`);
  console.log(`Annualized WRVUs: ${annualizedWRVUs}`);
  console.log(`FTE Adjusted WRVUs: ${fteAdjustedWRVUs}`);
  console.log('Benchmarks:', benchmarks);

  // If below 25th percentile
  if (fteAdjustedWRVUs < benchmarks[0].value) {
    const percentile = (fteAdjustedWRVUs / benchmarks[0].value) * 25;
    console.log(`Below 25th percentile: (${fteAdjustedWRVUs} / ${benchmarks[0].value}) * 25 = ${percentile}%`);
    return percentile;
  }

  // If above 90th percentile
  if (fteAdjustedWRVUs > benchmarks[3].value) {
    const percentile = 90 + ((fteAdjustedWRVUs - benchmarks[3].value) / benchmarks[3].value) * 10;
    const finalPercentile = Math.min(100, percentile);
    console.log(`Above 90th percentile: 90 + ((${fteAdjustedWRVUs} - ${benchmarks[3].value}) / ${benchmarks[3].value}) * 10 = ${finalPercentile}%`);
    return finalPercentile;
  }

  // Find which benchmarks we're between
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedWRVUs >= lower.value && fteAdjustedWRVUs <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedWRVUs - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      const percentile = lower.percentile + (position / range) * percentileRange;
      console.log(`Between ${lower.percentile}th and ${upper.percentile}th percentile:`);
      console.log(`${lower.percentile} + ((${fteAdjustedWRVUs} - ${lower.value}) / (${upper.value} - ${lower.value})) * (${upper.percentile} - ${lower.percentile}) = ${percentile}%`);
      return percentile;
    }
  }

  return 0;
}

function calculateCompPercentile(annualCompensation: number, fte: number, marketData: any): number {
  if (!marketData) return 0;

  // Adjust for FTE if less than 1.0
  const fteAdjustedComp = fte < 1.0 ? annualCompensation / fte : annualCompensation;

  const benchmarks = [
    { percentile: 25, value: marketData.p25_total || 0 },
    { percentile: 50, value: marketData.p50_total || 0 },
    { percentile: 75, value: marketData.p75_total || 0 },
    { percentile: 90, value: marketData.p90_total || 0 }
  ];

  // If below 25th percentile
  if (fteAdjustedComp < benchmarks[0].value) {
    return benchmarks[0].value > 0 ? (fteAdjustedComp / benchmarks[0].value) * 25 : 0;
  }

  // If above 90th percentile
  if (fteAdjustedComp > benchmarks[3].value) {
    const extraPercentile = benchmarks[3].value > 0 
      ? ((fteAdjustedComp - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 0;
    return Math.min(100, 90 + extraPercentile);
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedComp >= lower.value && fteAdjustedComp <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedComp - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      return range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
    }
  }

  return 0;
}

async function updatePercentiles() {
  try {
    // Get all active providers with their metrics
    const providers = await prisma.provider.findMany({
      where: { status: 'Active' },
      include: {
        metrics: {
          where: { year: 2024 },
          orderBy: { month: 'asc' }
        }
      }
    });

    // Get market data for all specialties
    const marketData = await prisma.marketData.findMany();
    console.log(`Found ${marketData.length} market data records`);

    let skippedProviders = 0;
    let updatedRecords = 0;

    for (const provider of providers) {
      console.log(`\nProcessing provider: ${provider.firstName} ${provider.lastName} (${provider.specialty})`);
      
      // Find market data for provider's specialty
      const providerMarketData = marketData.find(m => m.specialty === provider.specialty);
      if (!providerMarketData) {
        console.log(`No market data found for specialty: ${provider.specialty}`);
        skippedProviders++;
        continue;
      }

      // Update metrics for each month
      for (const metric of provider.metrics) {
        const wrvuPercentile = calculateWRVUPercentile(
          metric.actualWRVUs,
          metric.month,
          provider.fte,
          providerMarketData
        );

        // Update the metric record
        await prisma.providerMetrics.update({
          where: { id: metric.id },
          data: { wrvuPercentile }
        });

        updatedRecords++;
      }
    }

    console.log(`\nUpdate complete:`);
    console.log(`Updated ${updatedRecords} metric records`);
    console.log(`Skipped ${skippedProviders} providers due to missing market data`);

  } catch (error) {
    console.error('Error updating percentiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePercentiles(); 