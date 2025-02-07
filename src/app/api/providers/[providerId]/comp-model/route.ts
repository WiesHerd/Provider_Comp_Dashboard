import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { providerId: string } }
) {
  try {
    const { compensationModel, tieredCFConfigId } = await request.json();
    const { providerId } = params;

    const updatedProvider = await prisma.provider.update({
      where: {
        id: providerId,
      },
      data: {
        compensationModel,
        ...(compensationModel === 'Tiered CF' && tieredCFConfigId
          ? { tieredCFConfigId }
          : {}),
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