import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    const wrvuData = await prisma.wRVUData.findMany({
      where: {
        year: currentYear
      },
      include: {
        provider: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        }
      }
    });

    // Transform the data to match the expected format
    const formattedData = wrvuData.map(data => ({
      id: data.id,
      employee_id: data.provider.employeeId,
      first_name: data.provider.firstName,
      last_name: data.provider.lastName,
      specialty: data.provider.specialty,
      year: data.year,
      jan: data.jan,
      feb: data.feb,
      mar: data.mar,
      apr: data.apr,
      may: data.may,
      jun: data.jun,
      jul: data.jul,
      aug: data.aug,
      sep: data.sep,
      oct: data.oct,
      nov: data.nov,
      dec: data.dec
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wRVU data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // First, ensure the provider exists
    const provider = await prisma.provider.findUnique({
      where: {
        employeeId: data.employee_id
      }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Create the wRVU data
    const wrvuData = await prisma.wRVUData.create({
      data: {
        year: data.year,
        jan: data.jan || 0,
        feb: data.feb || 0,
        mar: data.mar || 0,
        apr: data.apr || 0,
        may: data.may || 0,
        jun: data.jun || 0,
        jul: data.jul || 0,
        aug: data.aug || 0,
        sep: data.sep || 0,
        oct: data.oct || 0,
        nov: data.nov || 0,
        dec: data.dec || 0,
        providerId: provider.id
      }
    });

    return NextResponse.json(wrvuData);
  } catch (error) {
    console.error('Error creating wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to create wRVU data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing wRVU data ID' },
        { status: 400 }
      );
    }

    // Update the wRVU data
    const wrvuData = await prisma.wRVUData.update({
      where: {
        id: data.id
      },
      data: {
        year: data.year,
        jan: data.jan || 0,
        feb: data.feb || 0,
        mar: data.mar || 0,
        apr: data.apr || 0,
        may: data.may || 0,
        jun: data.jun || 0,
        jul: data.jul || 0,
        aug: data.aug || 0,
        sep: data.sep || 0,
        oct: data.oct || 0,
        nov: data.nov || 0,
        dec: data.dec || 0
      }
    });

    return NextResponse.json(wrvuData);
  } catch (error) {
    console.error('Error updating wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to update wRVU data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be an array' },
        { status: 400 }
      );
    }

    await prisma.wRVUData.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({ message: 'Records deleted successfully' });
  } catch (error) {
    console.error('Error deleting wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to delete wRVU data' },
      { status: 500 }
    );
  }
} 