import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching providers for search...');
    
    // Get only active providers
    const providers = await prisma.provider.findMany({
      where: {
        status: 'Active'
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        specialty: true
      },
      orderBy: {
        lastName: 'asc'
      }
    });

    console.log(`Found ${providers.length} providers:`, providers);

    if (providers.length === 0) {
      console.log('No active providers found in the database');
      return NextResponse.json([]);
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