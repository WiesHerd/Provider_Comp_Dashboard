import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Delete all wRVU history first (due to foreign key constraints)
    const historyResult = await prisma.wRVUHistory.deleteMany();
    
    // Delete all wRVU data
    const wrvuResult = await prisma.wRVUData.deleteMany();
    
    return new NextResponse(JSON.stringify({ 
      message: 'wRVU data cleared successfully',
      count: {
        wrvuData: wrvuResult.count,
        history: historyResult.count
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error clearing wRVU data:', error);
    return new NextResponse(JSON.stringify({
      error: 'Failed to clear wRVU data'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 