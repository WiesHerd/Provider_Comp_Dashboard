import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching providers for search...');
    
    // Get providers without status filter
    const providers = await prisma.provider.findMany({
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

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers for search:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
} 