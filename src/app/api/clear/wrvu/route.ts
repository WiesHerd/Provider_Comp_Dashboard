import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Delete all wRVU data first (due to foreign key constraints)
    const wrvuResult = await prisma.wRVUData.deleteMany();
    
    // Delete all providers
    const providerResult = await prisma.provider.deleteMany();
    
    return new NextResponse(JSON.stringify({ 
      message: 'All data cleared successfully',
      count: {
        wrvuData: wrvuResult.count,
        providers: providerResult.count
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return new NextResponse(JSON.stringify({
      error: 'Failed to clear data'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 