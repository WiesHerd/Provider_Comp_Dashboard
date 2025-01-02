import prisma from '@/lib/prisma';

async function updateYearsOfExperience() {
  try {
    console.log('Starting YOE update...');
    
    // Get all providers
    const providers = await prisma.provider.findMany();
    console.log(`Found ${providers.length} providers to update`);

    // Update each provider's YOE
    const today = new Date();
    const updates = providers.map(async (provider) => {
      const yearsOfExperience = Number(
        ((today.getTime() - provider.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2)
      );

      return prisma.provider.update({
        where: { id: provider.id },
        data: { yearsOfExperience }
      });
    });

    // Execute all updates
    await Promise.all(updates);
    console.log('Successfully updated YOE for all providers');
  } catch (error) {
    console.error('Error updating YOE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateYearsOfExperience(); 