import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Expected an array of IDs.' },
        { status: 400 }
      );
    }

    await prisma.wrvuData.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({ 
      message: 'wRVU data deleted successfully',
      count: ids.length
    });
  } catch (error) {
    console.error('Error deleting wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to delete wRVU data' },
      { status: 500 }
    );
  }
} 