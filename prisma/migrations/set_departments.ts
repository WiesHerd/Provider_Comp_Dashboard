const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setDepartments() {
  try {
    // Get all providers
    const providers = await prisma.provider.findMany();
    
    // Update each provider's department to match their specialty
    for (const provider of providers) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          department: provider.specialty
        }
      });
    }
    
    console.log('All providers updated with departments');
  } catch (error) {
    console.error('Error updating departments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
setDepartments(); 