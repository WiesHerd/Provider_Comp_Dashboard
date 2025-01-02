const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all providers
  const providers = await prisma.provider.findMany();
  
  // Update each provider with missing fields
  for (const provider of providers) {
    const employeeId = provider.employeeId || `EMP${String(Math.floor(1000 + Math.random() * 9000))}`;
    const email = provider.email || `${provider.firstName.toLowerCase()}.${provider.lastName.toLowerCase()}@example.com`;
    const department = provider.department || provider.specialty;
    const status = provider.status || 'Active';
    const fte = provider.fte || 1.0;
    const clinicalFte = provider.clinicalFte || 0.8;
    const nonClinicalFte = provider.nonClinicalFte || 0.2;

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        employeeId,
        email,
        department,
        status,
        fte,
        clinicalFte,
        nonClinicalFte,
      },
    });
    console.log(`Updated provider ${provider.firstName} ${provider.lastName} with:`, {
      employeeId,
      email,
      department,
      fte,
      clinicalFte,
      nonClinicalFte,
    });
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