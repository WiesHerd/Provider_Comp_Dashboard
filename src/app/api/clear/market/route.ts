import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Delete all market data
    const result = await prisma.marketData.deleteMany();
    
    return new NextResponse(JSON.stringify({ 
      message: 'Market data cleared successfully',
      count: result.count
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error clearing market data:', error);
    return new NextResponse(JSON.stringify({
      error: 'Failed to clear market data'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 