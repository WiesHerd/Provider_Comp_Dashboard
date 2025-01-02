const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all providers
  const providers = await prisma.provider.findMany();
  
  // Update each provider with an employee ID if they don't have one
  for (const provider of providers) {
    if (!provider.employeeId) {
      const employeeId = `EMP${String(Math.floor(1000 + Math.random() * 9000))}`; // Generate EMP1000-EMP9999
      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          employeeId,
          email: provider.email || `${provider.firstName.toLowerCase()}.${provider.lastName.toLowerCase()}@example.com`,
        },
      });
      console.log(`Updated provider ${provider.firstName} ${provider.lastName} with employee ID: ${employeeId}`);
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