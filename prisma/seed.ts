import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test providers
  const providers = [
    {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      specialty: 'Cardiology',
      department: 'Medicine',
      hireDate: new Date('2023-01-01'),
      fte: 1.0,
      baseSalary: 250000,
      compensationModel: 'wRVU',
      clinicalFte: 0.8,
      nonClinicalFte: 0.2,
      clinicalSalary: 200000,
      nonClinicalSalary: 50000,
      targetWRVUs: 5000,
    },
    {
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      specialty: 'Orthopedics',
      department: 'Surgery',
      hireDate: new Date('2023-02-01'),
      fte: 1.0,
      baseSalary: 300000,
      compensationModel: 'wRVU',
      clinicalFte: 1.0,
      nonClinicalFte: 0.0,
      clinicalSalary: 300000,
      nonClinicalSalary: 0,
      targetWRVUs: 6000,
    },
  ];

  for (const provider of providers) {
    const createdProvider = await prisma.provider.upsert({
      where: { employeeId: provider.employeeId },
      update: provider,
      create: provider,
    });

    // Add wRVU data for the last 3 months
    const currentDate = new Date();
    for (let i = 0; i < 3; i++) {
      const month = currentDate.getMonth() - i;
      const year = currentDate.getFullYear();
      
      await prisma.wRVUData.upsert({
        where: {
          providerId_year_month: {
            providerId: createdProvider.id,
            year,
            month: month + 1,
          },
        },
        update: {
          value: Math.floor(Math.random() * 500) + 300,
          hours: 160,
        },
        create: {
          providerId: createdProvider.id,
          year,
          month: month + 1,
          value: Math.floor(Math.random() * 500) + 300,
          hours: 160,
        },
      });

      // Add provider metrics
      await prisma.providerMetrics.upsert({
        where: {
          providerId_year_month: {
            providerId: createdProvider.id,
            year,
            month: month + 1,
          },
        },
        update: {
          actualWRVUs: Math.floor(Math.random() * 500) + 300,
          targetWRVUs: provider.targetWRVUs / 12,
          baseSalary: provider.baseSalary / 12,
          totalCompensation: (provider.baseSalary / 12) + Math.random() * 10000,
          incentivesEarned: Math.random() * 5000,
          holdbackAmount: Math.random() * 2000,
          wrvuPercentile: Math.random() * 100,
          compPercentile: Math.random() * 100,
          planProgress: Math.random() * 100,
        },
        create: {
          providerId: createdProvider.id,
          year,
          month: month + 1,
          actualWRVUs: Math.floor(Math.random() * 500) + 300,
          targetWRVUs: provider.targetWRVUs / 12,
          baseSalary: provider.baseSalary / 12,
          totalCompensation: (provider.baseSalary / 12) + Math.random() * 10000,
          incentivesEarned: Math.random() * 5000,
          holdbackAmount: Math.random() * 2000,
          wrvuPercentile: Math.random() * 100,
          compPercentile: Math.random() * 100,
          planProgress: Math.random() * 100,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 