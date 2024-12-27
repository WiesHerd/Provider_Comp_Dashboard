import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { providerId: string } }
) {
  try {
    const { status, terminationDate } = await request.json();
    
    // If reactivating a provider, clear the termination date
    const updateData = status === 'Active' 
      ? { status, terminationDate: null }
      : { status, terminationDate: terminationDate ? new Date(terminationDate) : null };
    
    const provider = await prisma.provider.update({
      where: {
        employeeId: params.providerId,
      },
      data: updateData,
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