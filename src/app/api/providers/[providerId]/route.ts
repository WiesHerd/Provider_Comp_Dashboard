import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/providers/[employeeId] - Update a provider
export async function PATCH(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const employeeId = params.employeeId;
    const data = await request.json();

    const provider = await prisma.provider.update({
      where: { employeeId },
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

// DELETE /api/providers/[employeeId] - Delete a provider
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const employeeId = params.employeeId;
    await prisma.provider.delete({
      where: { employeeId },
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

// GET /api/providers/[providerId] - Get a provider with their wRVU data
export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const providerId = await params.providerId;
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        wrvuData: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    );
  }
} 