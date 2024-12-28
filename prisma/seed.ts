import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const testProvider = await prisma.provider.create({
    data: {
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@healthsystem.org",
      specialty: "Internal Medicine",
      department: "Internal Medicine",
      status: "Active",
      hireDate: new Date("2023-01-01"),
      fte: 1.0,
      baseSalary: 250000,
      compensationModel: "Standard"
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