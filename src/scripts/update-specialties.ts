const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const specialtyMappings = {
  'Psychiatry - Child and Adolescent': 'Psychiatry Child and Adolescent',
  'Critical Care Medicine - Cardiology': 'Critical Care Medicine Cardiology',
  'Sports Medicine - Medical': 'Sports Medicine Medical'
};

async function updateSpecialties() {
  try {
    console.log('Starting specialty updates...');
    
    for (const [oldSpecialty, newSpecialty] of Object.entries(specialtyMappings)) {
      const result = await prisma.provider.updateMany({
        where: { specialty: oldSpecialty },
        data: { specialty: newSpecialty }
      });
      
      console.log(`Updated ${result.count} providers from "${oldSpecialty}" to "${newSpecialty}"`);
    }
    
    console.log('Specialty updates completed.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSpecialties(); 