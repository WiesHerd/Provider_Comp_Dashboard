const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTargets() {
  try {
    // Get all active providers
    const providers = await prisma.provider.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialty: true,
        targetWRVUs: true,
        clinicalFte: true,
        fte: true
      }
    });

    console.log(`Found ${providers.length} active providers`);

    // Get market data for all specialties
    const marketData = await prisma.marketData.findMany();
    console.log(`Found ${marketData.length} market data records`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const provider of providers) {
      // Get provider's market data
      const providerMarketData = marketData.find(m => m.specialty === provider.specialty);
      if (!providerMarketData) {
        console.log(`No market data found for specialty: ${provider.specialty}`);
        skippedCount++;
        continue;
      }

      // Calculate target WRVUs based on market data and FTE
      const fte = provider.clinicalFte || provider.fte || 1.0;
      const targetWRVUs = Math.round(providerMarketData.p50_wrvu * fte);

      // Update provider's target WRVUs
      await prisma.provider.update({
        where: { id: provider.id },
        data: { targetWRVUs }
      });

      console.log(`Updated ${provider.firstName} ${provider.lastName} (${provider.specialty}): ${targetWRVUs} WRVUs`);
      updatedCount++;
    }

    console.log(`\nFinished updating targets:`);
    console.log(`- Updated ${updatedCount} providers`);
    console.log(`- Skipped ${skippedCount} providers due to missing market data`);

  } catch (error) {
    console.error('Error updating targets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTargets(); 