const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdjustments() {
  try {
    const adjustments = await prisma.wRVUAdjustment.findMany({
      where: {
        year: 2024,
        month: 1
      },
      include: {
        provider: true
      }
    });
    
    console.log(`Found ${adjustments.length} WRVU adjustments for January 2024`);
    
    if (adjustments.length > 0) {
      adjustments.forEach(adj => {
        console.log(`\nProvider: ${adj.provider.firstName} ${adj.provider.lastName}`);
        console.log(`Adjustment Name: ${adj.name}`);
        console.log(`Value: ${adj.value}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdjustments(); 