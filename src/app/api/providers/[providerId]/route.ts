import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/providers/[providerId] - Update a provider
export async function PATCH(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const providerId = params.providerId;
    const data = await request.json();

    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        specialty: data.specialty,
        department: data.department,
        status: data.status,
        hireDate: new Date(data.hireDate),
        fte: data.fte,
        baseSalary: data.baseSalary,
        compensationModel: data.compensationModel,
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}

// DELETE /api/providers/[providerId] - Delete a provider
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const providerId = params.providerId;
    await prisma.provider.delete({
      where: { id: providerId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    );
  }
} 