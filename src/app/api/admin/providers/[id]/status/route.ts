import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status, terminationDate } = await request.json();

    console.log('Updating provider status:', { id, status, terminationDate });

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        status,
        terminationDate: terminationDate ? new Date(terminationDate) : null,
      },
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider status:', error);
    return NextResponse.json(
      { error: 'Failed to update provider status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 