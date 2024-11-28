import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const testProvider = await prisma.provider.create({
    data: {
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Doe",
      specialty: "Internal Medicine",
      annualSalary: 250000,
      annualWRVUTarget: 5000,
      conversionFactor: 45.00,
    },
  });

  console.log({ testProvider });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 