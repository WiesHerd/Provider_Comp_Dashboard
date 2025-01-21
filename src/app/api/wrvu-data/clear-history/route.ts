import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be an array' },
        { status: 400 }
      );
    }

    // Delete history records for the specified wRVU data records
    await prisma.wRVUHistory.deleteMany({
      where: {
        wrvuDataId: {
          in: ids
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear history:', error);
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }
} 