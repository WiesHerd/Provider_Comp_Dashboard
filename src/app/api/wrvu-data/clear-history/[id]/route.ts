import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete all history records for this wRVU data
    await prisma.wRVUHistory.deleteMany({
      where: {
        wrvuDataId: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear wRVU history:', error);
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }
} 