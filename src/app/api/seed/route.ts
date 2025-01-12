import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting database seed...');

    // Create test market data
    const marketData = await prisma.marketData.upsert({
      where: { specialty: 'Internal Medicine' },
      update: {},
      create: {
        specialty: 'Internal Medicine',
        p25_total: 250000,
        p50_total: 300000,
        p75_total: 350000,
        p90_total: 400000,
        p25_wrvu: 4000,
        p50_wrvu: 4500,
        p75_wrvu: 5000,
        p90_wrvu: 5500,
        p25_cf: 50,
        p50_cf: 55,
        p75_cf: 60,
        p90_cf: 65
      }
    });

    // Create test provider
    const provider = await prisma.provider.upsert({
      where: { employeeId: 'TEST001' },
      update: {},
      create: {
        employeeId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        specialty: 'Internal Medicine',
        department: 'Medicine',
        status: 'Active',
        hireDate: new Date('2023-01-01'),
        yearsOfExperience: 5,
        fte: 1.0,
        clinicalFte: 0.8,
        nonClinicalFte: 0.2,
        baseSalary: 300000,
        clinicalSalary: 240000,
        nonClinicalSalary: 60000,
        compensationModel: 'Production',
        targetWRVUs: 4500
      }
    });

    // Create test WRVU data
    const currentYear = new Date().getFullYear();
    const wrvuData = [];
    for (let month = 1; month <= 12; month++) {
      const wrvu = await prisma.wRVUData.upsert({
        where: {
          providerId_year_month: {
            providerId: provider.id,
            year: currentYear,
            month
          }
        },
        update: {},
        create: {
          providerId: provider.id,
          year: currentYear,
          month,
          value: 375, // 4500 annual target / 12 months
          hours: 160 // Standard monthly hours
        }
      });
      wrvuData.push(wrvu);
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Test data seeded successfully',
      data: {
        marketData,
        provider,
        wrvuData
      }
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 