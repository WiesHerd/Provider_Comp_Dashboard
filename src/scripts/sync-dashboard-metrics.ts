const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncDashboardMetrics() {
  try {
    console.log('Starting dashboard metrics sync...');

    // Get all active providers
    const providers = await prisma.provider.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialty: true,
        baseSalary: true,
        targetWRVUs: true,
        clinicalFte: true,
        fte: true,
        settings: true,
        wrvuAdjustments: {
          where: { year: 2024 }
        },
        targetAdjustments: {
          where: { year: 2024 }
        }
      }
    });

    console.log(`Found ${providers.length} active providers`);

    // Get market data for all specialties
    const marketData = await prisma.marketData.findMany();
    console.log(`Found ${marketData.length} market data records`);

    // Get WRVU data for 2024
    const wrvuData = await prisma.wRVUData.findMany({
      where: { year: 2024 }
    });
    console.log(`Found ${wrvuData.length} WRVU records for 2024`);

    let skippedProviders = 0;
    let updatedRecords = 0;

    for (const provider of providers) {
      console.log(`\nProcessing provider: ${provider.firstName} ${provider.lastName} (${provider.specialty})`);
      
      // Get provider's market data
      const providerMarketData = marketData.find(m => m.specialty === provider.specialty);
      if (!providerMarketData) {
        console.log(`No market data found for specialty: ${provider.specialty}`);
        skippedProviders++;
        continue;
      }

      // Get provider's WRVU data
      const providerWRVUs = wrvuData.filter(w => w.providerId === provider.id);
      console.log(`Found ${providerWRVUs.length} WRVU records for provider`);

      // Sort WRVU data by month to process chronologically
      const sortedWRVUs = providerWRVUs.sort((a, b) => a.month - b.month);
      
      let ytdWRVUs = 0;
      let ytdTarget = 0;

      for (const wrvu of sortedWRVUs) {
        console.log(`\nProcessing month ${wrvu.month}:`);
        
        // Calculate total actual WRVUs including adjustments for this month
        const wrvuAdjustments = provider.wrvuAdjustments
          .filter(adj => adj.month === wrvu.month && adj.year === wrvu.year)
          .reduce((sum, adj) => sum + adj.value, 0);
        
        console.log(`WRVU Adjustments: ${wrvuAdjustments}`);
        const monthlyWRVUs = wrvu.value + wrvuAdjustments;
        ytdWRVUs += monthlyWRVUs;
        console.log(`Monthly WRVUs: ${monthlyWRVUs}`);
        console.log(`YTD WRVUs: ${ytdWRVUs}`);

        // Calculate total target including adjustments for this month
        const targetAdjustments = provider.targetAdjustments
          .filter(adj => adj.month === wrvu.month && adj.year === wrvu.year)
          .reduce((sum, adj) => sum + adj.value, 0);
        
        console.log(`Target Adjustments: ${targetAdjustments}`);
        const monthlyTarget = (provider.targetWRVUs / 12) + targetAdjustments;
        ytdTarget += monthlyTarget;
        console.log(`Monthly Target: ${monthlyTarget}`);
        console.log(`YTD Target: ${ytdTarget}`);

        // Calculate variance and incentive
        const variance = monthlyWRVUs - monthlyTarget;
        console.log(`Variance: ${variance}`);
        console.log(`Conversion Factor: ${providerMarketData.p50_cf}`);

        const incentiveAmount = variance > 0 ? variance * providerMarketData.p50_cf : 0;
        console.log(`Incentive Amount: ${incentiveAmount}`);

        // Get holdback percentage (default to 5% if no settings)
        const holdbackPercent = provider.settings?.holdbackPercent ?? 5;
        console.log(`Holdback Percentage: ${holdbackPercent}%`);

        // Calculate plan progress
        const planProgress = monthlyTarget > 0 ? (monthlyWRVUs / monthlyTarget) * 100 : 0;
        console.log(`Plan Progress: ${planProgress}%`);

        // Calculate WRVU percentile based on YTD numbers
        const wrvuPercentile = calculateWRVUPercentile(ytdWRVUs, wrvu.month, provider.clinicalFte || provider.fte, providerMarketData);
        console.log(`WRVU Percentile Calculation:
          - YTD WRVUs: ${ytdWRVUs}
          - Months Completed: ${wrvu.month}
          - FTE: ${provider.clinicalFte || provider.fte}
          - Annualized WRVUs: ${(ytdWRVUs / wrvu.month) * 12}
          - Market Data Thresholds:
            p90: ${providerMarketData.p90_wrvu}
            p75: ${providerMarketData.p75_wrvu}
            p50: ${providerMarketData.p50_wrvu}
            p25: ${providerMarketData.p25_wrvu}
          - Calculated Percentile: ${wrvuPercentile}`);

        // Calculate compensation percentile
        const monthlyCompensation = (provider.baseSalary / 12) + incentiveAmount;
        const ytdCompensation = monthlyCompensation * wrvu.month;
        const compPercentile = calculateCompPercentile(ytdCompensation, provider.clinicalFte || provider.fte, providerMarketData);

        // Update or create metric record
        const metric = await prisma.providerMetrics.upsert({
          where: {
            providerId_year_month: {
              providerId: provider.id,
              year: wrvu.year,
              month: wrvu.month
            }
          },
          update: {
            actualWRVUs: monthlyWRVUs,
            rawMonthlyWRVUs: wrvu.value,
            ytdWRVUs: ytdWRVUs,
            targetWRVUs: monthlyTarget,
            ytdTargetWRVUs: ytdTarget,
            totalCompensation: monthlyCompensation,
            incentivesEarned: incentiveAmount,
            holdbackAmount: incentiveAmount * (holdbackPercent / 100),
            wrvuPercentile: wrvuPercentile,
            compPercentile: compPercentile,
            planProgress: planProgress
          },
          create: {
            providerId: provider.id,
            year: wrvu.year,
            month: wrvu.month,
            actualWRVUs: monthlyWRVUs,
            rawMonthlyWRVUs: wrvu.value,
            ytdWRVUs: ytdWRVUs,
            targetWRVUs: monthlyTarget,
            ytdTargetWRVUs: ytdTarget,
            baseSalary: provider.baseSalary / 12,
            totalCompensation: monthlyCompensation,
            incentivesEarned: incentiveAmount,
            holdbackAmount: incentiveAmount * (holdbackPercent / 100),
            wrvuPercentile: wrvuPercentile,
            compPercentile: compPercentile,
            planProgress: planProgress
          }
        });

        updatedRecords++;
      }
    }

    console.log(`\nSync completed:`);
    console.log(`- Updated ${updatedRecords} metric records`);
    console.log(`- Skipped ${skippedProviders} providers due to missing market data`);

  } catch (error) {
    console.error('Error syncing dashboard metrics:', error);
    throw error;
  }
}

function calculateWRVUPercentile(ytdWRVUs: number, monthsCompleted: number, fte: number, marketData: any) {
  if (!marketData || monthsCompleted === 0) return 0;

  // Annualize YTD wRVUs based on months completed
  const annualizedWRVUs = (ytdWRVUs / monthsCompleted) * 12;
  
  // Adjust for FTE if less than 1.0
  const fteAdjustedWRVUs = fte < 1.0 ? annualizedWRVUs / fte : annualizedWRVUs;

  // Compare to market data thresholds and interpolate
  const benchmarks = [
    { percentile: 25, value: marketData.p25_wrvu || 0 },
    { percentile: 50, value: marketData.p50_wrvu || 0 },
    { percentile: 75, value: marketData.p75_wrvu || 0 },
    { percentile: 90, value: marketData.p90_wrvu || 0 }
  ];

  // If below 25th percentile
  if (fteAdjustedWRVUs < benchmarks[0].value) {
    return benchmarks[0].value > 0 ? (fteAdjustedWRVUs / benchmarks[0].value) * 25 : 0;
  }

  // If above 90th percentile
  if (fteAdjustedWRVUs > benchmarks[3].value) {
    const extraPercentile = benchmarks[3].value > 0 
      ? ((fteAdjustedWRVUs - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 0;
    return Math.min(100, 90 + extraPercentile);
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedWRVUs >= lower.value && fteAdjustedWRVUs <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedWRVUs - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      return range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
    }
  }

  return 0;
}

function calculateCompPercentile(annualCompensation: number, fte: number, marketData: any) {
  if (!marketData) return 0;

  // Adjust total comp for FTE if less than 1.0
  const fteAdjustedTotalComp = fte < 1.0 ? annualCompensation / fte : annualCompensation;

  // Compare to market data thresholds and interpolate
  const benchmarks = [
    { percentile: 25, value: marketData.p25_total || 0 },
    { percentile: 50, value: marketData.p50_total || 0 },
    { percentile: 75, value: marketData.p75_total || 0 },
    { percentile: 90, value: marketData.p90_total || 0 }
  ];

  // If below 25th percentile
  if (fteAdjustedTotalComp < benchmarks[0].value) {
    return benchmarks[0].value > 0 ? (fteAdjustedTotalComp / benchmarks[0].value) * 25 : 0;
  }

  // If above 90th percentile
  if (fteAdjustedTotalComp > benchmarks[3].value) {
    const extraPercentile = benchmarks[3].value > 0 
      ? ((fteAdjustedTotalComp - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 0;
    return Math.min(100, 90 + extraPercentile);
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedTotalComp >= lower.value && fteAdjustedTotalComp <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedTotalComp - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      return range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
    }
  }

  return 0;
}

module.exports = syncDashboardMetrics;

// Call the function if this file is run directly
if (require.main === module) {
  syncDashboardMetrics()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
} 