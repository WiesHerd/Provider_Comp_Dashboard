import { prisma } from '@/lib/prisma';

async function updateProviderDefaults() {
  try {
    // Get all providers
    const providers = await prisma.provider.findMany();
    
    // Update each provider with default values
    for (const provider of providers) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          clinicalFte: provider.clinicalFte || 0,
          nonClinicalFte: provider.nonClinicalFte || 0,
          fte: provider.fte || (provider.clinicalFte || 0) + (provider.nonClinicalFte || 0),
          department: provider.department || provider.specialty,
          status: provider.status || 'Active',
          email: provider.email || `${provider.firstName.toLowerCase()}.${provider.lastName.toLowerCase()}@example.com`,
          baseSalary: provider.baseSalary || 0,
          clinicalSalary: provider.clinicalSalary || 0,
          nonClinicalSalary: provider.nonClinicalSalary || 0,
          compensationModel: provider.compensationModel || 'wRVU',
          targetWRVUs: provider.targetWRVUs || 0,
          hireDate: provider.hireDate || new Date()
        }
      });
    }
    
    console.log('Successfully updated all providers with default values');
  } catch (error) {
    console.error('Error updating providers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateProviderDefaults(); 