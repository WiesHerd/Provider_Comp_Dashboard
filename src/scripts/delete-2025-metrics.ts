const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteMetrics() {
  try {
    const count = await prisma.providerMetrics.deleteMany({
      where: {
        year: 2025
      }
    });
    
    console.log(`Deleted ${count.count} metrics records from 2025`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteMetrics(); 