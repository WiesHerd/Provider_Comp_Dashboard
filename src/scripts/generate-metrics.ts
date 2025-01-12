const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateMetrics() {
  try {
    console.log('Starting metrics generation...');

    // Get all active providers
    const providers = await prisma.provider.findMany({
      where: { status: 'Active' }
    });
    console.log(`Found ${providers.length} active providers`);

    let createdCount = 0;

    // Use 2024 as the year
    const year = 2024;
    const currentMonth = new Date().getMonth() + 1;

    for (const provider of providers) {
      console.log(`\nGenerating metrics for ${provider.firstName} ${provider.lastName}`);
      
      // Generate metrics for each month up to current month
      for (let month = 1; month <= currentMonth; month++) {
        // Generate random WRVU data
        const rawMonthlyWRVUs = Math.random() * 300 + 100; // Random between 100 and 400
        const targetWRVUs = 250; // Fixed target for testing

        try {
          await prisma.providerMetrics.create({
            data: {
              providerId: provider.id,
              year,
              month,
              rawMonthlyWRVUs,
              actualWRVUs: rawMonthlyWRVUs,
              targetWRVUs,
              cumulativeWRVUs: 0,
              cumulativeTarget: 0,
              baseSalary: provider.baseSalary / 12,
              totalCompensation: 0,
              incentivesEarned: 0,
              holdbackAmount: 0,
              wrvuPercentile: 0,
              compPercentile: 0,
              planProgress: 0,
              monthsCompleted: month
            }
          });
          createdCount++;
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`Metrics already exist for ${provider.firstName} ${provider.lastName} - ${year}/${month}`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log(`\nSuccessfully created ${createdCount} metrics records`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateMetrics(); 