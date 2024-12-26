import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/providers - Get all providers
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: {
        lastName: 'asc',
      },
    });
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

// POST /api/providers - Create a new provider
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const provider = await prisma.provider.create({
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
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}

// DELETE /api/providers - Delete multiple providers
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    await prisma.provider.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting providers:', error);
    return NextResponse.json(
      { error: 'Failed to delete providers' },
      { status: 500 }
    );
  }
} 