import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get unique specialties
    const specialties = await prisma.provider.findMany({
      where: { status: 'Active' },
      select: { specialty: true },
      distinct: ['specialty'],
      orderBy: { specialty: 'asc' }
    });

    // Get unique departments
    const departments = await prisma.provider.findMany({
      where: { status: 'Active' },
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' }
    });

    return NextResponse.json({
      specialties: specialties.map(s => s.specialty).filter(Boolean),
      departments: departments.map(d => d.department).filter(Boolean)
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
} 