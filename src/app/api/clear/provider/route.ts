import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // First delete related data
    await prisma.wRVUData.deleteMany({
      where: { provider: { isNot: null } }
    });
    await prisma.wRVUAdjustment.deleteMany({
      where: { provider: { isNot: null } }
    });
    await prisma.targetAdjustment.deleteMany({
      where: { provider: { isNot: null } }
    });
    await prisma.additionalPayment.deleteMany({
      where: { provider: { isNot: null } }
    });
    await prisma.compensationChange.deleteMany({
      where: { provider: { isNot: null } }
    });
    
    // Then delete providers
    const result = await prisma.provider.deleteMany();
    
    return new NextResponse(JSON.stringify({ 
      message: 'Provider data cleared successfully',
      count: result.count
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error clearing provider data:', error);
    return new NextResponse(JSON.stringify({
      error: 'Failed to clear provider data'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 