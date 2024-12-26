import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  context: { params: { providerId: string } }
) {
  try {
    const providerId = await context.params.providerId;
    const { status } = await request.json();

    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        status,
        terminationDate: status === 'Inactive' ? new Date() : null,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error updating provider status:', error);
    return NextResponse.json(
      { error: 'Failed to update provider status' },
      { status: 500 }
    );
  }
} 