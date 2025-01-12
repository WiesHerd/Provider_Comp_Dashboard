const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compareSpecialties() {
  try {
    const providers = await prisma.provider.findMany({
      select: { specialty: true },
      distinct: ['specialty']
    });
    
    const marketData = await prisma.marketData.findMany({
      select: { specialty: true },
      distinct: ['specialty']
    });

    console.log('Provider Specialties:', providers.map(p => p.specialty).sort());
    console.log('\nMarket Data Specialties:', marketData.map(m => m.specialty).sort());

    // Find specialties that don't have market data
    const missingMarketData = providers
      .map(p => p.specialty)
      .filter(specialty => !marketData.some(m => m.specialty === specialty));

    console.log('\nSpecialties missing market data:', missingMarketData);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareSpecialties(); 