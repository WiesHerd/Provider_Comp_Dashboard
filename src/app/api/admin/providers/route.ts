import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Fetching providers...');
    const providers = await prisma.provider.findMany({
      orderBy: {
        lastName: 'asc',
      }
    });

    // Log the data
    if (providers.length > 0) {
      console.log('Sample provider:', {
        id: providers[0].id,
        employeeId: providers[0].employeeId,
        name: `${providers[0].firstName} ${providers[0].lastName}`,
        specialty: providers[0].specialty,
        baseSalary: providers[0].baseSalary,
        fte: providers[0].fte,
        clinicalFte: providers[0].clinicalFte,
        nonClinicalFte: providers[0].nonClinicalFte
      });
    }

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers', details: error.message },
      { status: 500 }
    );
  }
} 