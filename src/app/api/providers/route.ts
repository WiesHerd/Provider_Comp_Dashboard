import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/providers - Get all providers
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: {
        lastName: 'asc',
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        specialty: true,
        department: true,
        status: true,
        terminationDate: true,
        hireDate: true,
        fte: true,
        baseSalary: true,
        compensationModel: true,
        clinicalFte: true,
        nonClinicalFte: true,
        clinicalSalary: true,
        nonClinicalSalary: true,
        createdAt: true,
        updatedAt: true,
        // Include counts of related data for badges/indicators
        _count: {
          select: {
            wrvuData: true,
          }
        }
      }
    });

    // Transform the data to include the hasWRVUs flag
    const transformedProviders = providers.map(provider => ({
      ...provider,
      hasWRVUs: provider._count.wrvuData > 0,
      // Remove the _count field from the final response
      _count: undefined
    }));

    return NextResponse.json(transformedProviders);
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