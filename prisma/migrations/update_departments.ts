import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all providers
  const providers = await prisma.provider.findMany();
  
  // Update each provider's department
  for (const provider of providers) {
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        department: provider.department || provider.specialty || 'Unknown',
      },
    });
    console.log(`Updated provider ${provider.firstName} ${provider.lastName} with department: ${provider.department || provider.specialty || 'Unknown'}`);
  }

  console.log('All providers updated with departments');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 