const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deleteMetrics() {
  try {
    const deleteResult = await prisma.providerMetrics.deleteMany({
      where: {
        year: 2025
      }
    })
    console.log(`Deleted ${deleteResult.count} records from year 2025`)
  } catch (error) {
    console.error('Error deleting records:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteMetrics() 