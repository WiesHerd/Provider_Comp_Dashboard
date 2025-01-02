const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Get all providers
  const providers = await prisma.provider.findMany();
  
  // Update each provider with proper defaults
  for (const provider of providers) {
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        email: provider.email || `${provider.firstName.toLowerCase()}.${provider.lastName.toLowerCase()}@example.com`,
        department: provider.department || provider.specialty, // Default department to specialty if not set
        status: provider.status || 'Active',
        fte: provider.fte || 1.0,
        clinicalFte: provider.clinicalFte || 0.8, // Default to 80% clinical
        nonClinicalFte: provider.nonClinicalFte || 0.2, // Default to 20% non-clinical
        baseSalary: provider.baseSalary || 250000, // Default base salary
        clinicalSalary: provider.clinicalSalary || 200000, // Default clinical salary
        nonClinicalSalary: provider.nonClinicalSalary || 50000, // Default non-clinical salary
        compensationModel: provider.compensationModel || 'wRVU',
        targetWRVUs: provider.targetWRVUs || 5000, // Default annual target
        hireDate: provider.hireDate || new Date('2024-01-01'), // Default to start of year if not set
      },
    });
    console.log(`Updated provider: ${provider.firstName} ${provider.lastName}`);
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