const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedData() {
  try {
    // Seed market data
    const marketDataSpecialties = [
      {
        specialty: 'Internal Medicine',
        p25_total: 250000,
        p50_total: 275000,
        p75_total: 300000,
        p90_total: 325000,
        p25_wrvu: 4000,
        p50_wrvu: 4500,
        p75_wrvu: 5000,
        p90_wrvu: 5500,
        p25_cf: 55,
        p50_cf: 60,
        p75_cf: 65,
        p90_cf: 70
      },
      {
        specialty: 'Family Medicine',
        p25_total: 230000,
        p50_total: 255000,
        p75_total: 280000,
        p90_total: 305000,
        p25_wrvu: 3800,
        p50_wrvu: 4300,
        p75_wrvu: 4800,
        p90_wrvu: 5300,
        p25_cf: 53,
        p50_cf: 58,
        p75_cf: 63,
        p90_cf: 68
      },
      {
        specialty: 'Cardiology',
        p25_total: 400000,
        p50_total: 450000,
        p75_total: 500000,
        p90_total: 550000,
        p25_wrvu: 5500,
        p50_wrvu: 6000,
        p75_wrvu: 6500,
        p90_wrvu: 7000,
        p25_cf: 70,
        p50_cf: 75,
        p75_cf: 80,
        p90_cf: 85
      },
      {
        specialty: 'Pediatrics',
        p25_total: 220000,
        p50_total: 245000,
        p75_total: 270000,
        p90_total: 295000,
        p25_wrvu: 3600,
        p50_wrvu: 4100,
        p75_wrvu: 4600,
        p90_wrvu: 5100,
        p25_cf: 52,
        p50_cf: 57,
        p75_cf: 62,
        p90_cf: 67
      },
      {
        specialty: 'Orthopedic Surgery',
        p25_total: 500000,
        p50_total: 550000,
        p75_total: 600000,
        p90_total: 650000,
        p25_wrvu: 7000,
        p50_wrvu: 7500,
        p75_wrvu: 8000,
        p90_wrvu: 8500,
        p25_cf: 75,
        p50_cf: 80,
        p75_cf: 85,
        p90_cf: 90
      },
      {
        specialty: 'General Surgery',
        p25_total: 380000,
        p50_total: 420000,
        p75_total: 460000,
        p90_total: 500000,
        p25_wrvu: 5800,
        p50_wrvu: 6300,
        p75_wrvu: 6800,
        p90_wrvu: 7300,
        p25_cf: 65,
        p50_cf: 70,
        p75_cf: 75,
        p90_cf: 80
      },
      {
        specialty: 'Psychiatry',
        p25_total: 240000,
        p50_total: 265000,
        p75_total: 290000,
        p90_total: 315000,
        p25_wrvu: 3500,
        p50_wrvu: 4000,
        p75_wrvu: 4500,
        p90_wrvu: 5000,
        p25_cf: 58,
        p50_cf: 63,
        p75_cf: 68,
        p90_cf: 73
      },
      {
        specialty: 'Psychiatry - Child and Adolescent',
        p25_total: 250000,
        p50_total: 275000,
        p75_total: 300000,
        p90_total: 325000,
        p25_wrvu: 3600,
        p50_wrvu: 4100,
        p75_wrvu: 4600,
        p90_wrvu: 5100,
        p25_cf: 60,
        p50_cf: 65,
        p75_cf: 70,
        p90_cf: 75
      },
      {
        specialty: 'Critical Care Medicine - Cardiology',
        p25_total: 420000,
        p50_total: 470000,
        p75_total: 520000,
        p90_total: 570000,
        p25_wrvu: 5700,
        p50_wrvu: 6200,
        p75_wrvu: 6700,
        p90_wrvu: 7200,
        p25_cf: 72,
        p50_cf: 77,
        p75_cf: 82,
        p90_cf: 87
      },
      {
        specialty: 'Sports Medicine - Medical',
        p25_total: 260000,
        p50_total: 285000,
        p75_total: 310000,
        p90_total: 335000,
        p25_wrvu: 4200,
        p50_wrvu: 4700,
        p75_wrvu: 5200,
        p90_wrvu: 5700,
        p25_cf: 57,
        p50_cf: 62,
        p75_cf: 67,
        p90_cf: 72
      }
    ];

    console.log('Seeding market data...');
    for (const data of marketDataSpecialties) {
      await prisma.marketData.upsert({
        where: { specialty: data.specialty },
        update: data,
        create: data
      });
    }

    console.log('Market data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedData()
  .catch(console.error); 