const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTargets() {
  try {
    const providers = await prisma.provider.findMany({
      select: {
        firstName: true,
        lastName: true,
        specialty: true,
        targetWRVUs: true
      }
    });

    console.log('\nProvider Targets:');
    providers.forEach(p => {
      console.log(`${p.firstName} ${p.lastName} (${p.specialty}): ${p.targetWRVUs}`);
    });

    console.log(`\nTotal providers checked: ${providers.length}`);
  } catch (error) {
    console.error('Error checking targets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTargets(); 