import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { providerId: string } }
) {
  try {
    const { compensationModel } = await request.json();
    const { providerId } = params;

    const updatedProvider = await prisma.provider.update({
      where: {
        employeeId: providerId,
      },
      data: {
        compensationModel,
      },
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Error updating compensation model:', error);
    return NextResponse.json(
      { error: 'Failed to update compensation model' },
      { status: 500 }
    );
  }
} 