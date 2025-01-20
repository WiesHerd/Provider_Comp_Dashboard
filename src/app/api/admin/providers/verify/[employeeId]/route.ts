import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const provider = await prisma.provider.findUnique({
      where: {
        employeeId: params.employeeId
      }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      provider: {
        id: provider.id,
        employeeId: provider.employeeId,
        firstName: provider.firstName,
        lastName: provider.lastName,
        specialty: provider.specialty
      }
    });
  } catch (error) {
    console.error('Error verifying provider:', error);
    return NextResponse.json(
      { error: 'Failed to verify provider' },
      { status: 500 }
    );
  }
} 