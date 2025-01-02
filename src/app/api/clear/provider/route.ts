import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Delete all related data first
    await prisma.wRVUData.deleteMany();
    await prisma.wRVUAdjustment.deleteMany();
    await prisma.targetAdjustment.deleteMany();
    await prisma.additionalPayment.deleteMany();
    await prisma.compensationChange.deleteMany();
    await prisma.providerMetrics.deleteMany();
    await prisma.providerAnalytics.deleteMany();
    
    // Then delete all providers
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