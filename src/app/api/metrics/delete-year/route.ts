import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2025');

    const deleteResult = await prisma.providerMetrics.deleteMany({
      where: {
        year: year
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} records for year ${year}`
    });
  } catch (error) {
    console.error('Error deleting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to delete metrics', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 