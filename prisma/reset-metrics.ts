const { PrismaClient } = require('@prisma/client')

async function resetTargets() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Resetting target columns in ProviderMetrics...')
    
    const result = await prisma.providerMetrics.updateMany({
      data: {
        targetWRVUs: 0,
        cumulativeTarget: 0
      }
    })
    
    console.log(`Reset ${result.count} records successfully`)
  } catch (error) {
    console.error('Error resetting targets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetTargets() 