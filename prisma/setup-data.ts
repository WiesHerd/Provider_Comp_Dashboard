const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // First, create a provider if it doesn't exist
  const provider = await prisma.provider.upsert({
    where: {
      employeeId: 'EMP1065'  // From your screenshot
    },
    update: {},
    create: {
      employeeId: 'EMP1065',
      firstName: 'Jessica',
      lastName: 'Anderson',
      email: 'jessica.anderson@example.com',
      specialty: 'Radiology',
      department: 'Radiology',
      hireDate: new Date(),
      fte: 1.0,
      baseSalary: 274923.00,
      compensationModel: 'standard'
    }
  })

  // Then create the WRVU adjustment
  const wrvuAdjustment = await prisma.wRVUAdjustment.create({
    data: {
      name: 'emr go live',
      description: 'Productivity loss. Compensation with wRVU.',
      year: 2024,
      jan: 52.00,
      feb: 62.00,
      mar: 35.00,
      apr: 52.00,
      may: 0.00,
      jun: 0.00,
      jul: 0.00,
      aug: 0.00,
      sep: 0.00,
      oct: 0.00,
      nov: 0.00,
      dec: 0.00,
      type: 'adjustment',
      category: 'operational',
      status: 'active',
      providerId: provider.id
    }
  })

  console.log('Created provider:', provider)
  console.log('Created WRVU adjustment:', wrvuAdjustment)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 