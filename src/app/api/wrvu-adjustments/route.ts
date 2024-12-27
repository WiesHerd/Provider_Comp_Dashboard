import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/wrvu-adjustments - Get all wRVU adjustments
export async function GET() {
  try {
    const adjustments = await prisma.wRVUAdjustment.findMany({
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

    return NextResponse.json(adjustments);
  } catch (error) {
    console.error('Error fetching wRVU adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wRVU adjustments' },
      { status: 500 }
    );
  }
}

// POST /api/wrvu-adjustments - Create a new wRVU adjustment
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received adjustment data:', data);

    // First, ensure the provider exists
    const provider = await prisma.provider.findUnique({
      where: {
        employeeId: data.employeeId
      }
    });

    if (!provider) {
      return new NextResponse(
        JSON.stringify({ error: 'Provider not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the wRVU adjustment
    const adjustment = await prisma.wRVUAdjustment.create({
      data: {
        name: data.name,
        description: data.description || '',
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
        type: data.type || 'wrvu',
        category: data.category || 'operational',
        status: data.status || 'active',
        providerId: provider.id
      }
    });

    // Return the adjustment formatted for frontend compatibility
    return new NextResponse(
      JSON.stringify({
        id: adjustment.id,
        metric: adjustment.name,
        description: adjustment.description,
        type: adjustment.type,
        isAdjustment: true,
        jan: adjustment.jan,
        feb: adjustment.feb,
        mar: adjustment.mar,
        apr: adjustment.apr,
        may: adjustment.may,
        jun: adjustment.jun,
        jul: adjustment.jul,
        aug: adjustment.aug,
        sep: adjustment.sep,
        oct: adjustment.oct,
        nov: adjustment.nov,
        dec: adjustment.dec
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating wRVU adjustment:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to create wRVU adjustment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// PUT /api/wrvu-adjustments - Update an existing wRVU adjustment
export async function PUT(request: Request) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing adjustment ID' },
        { status: 400 }
      );
    }

    // Update the wRVU adjustment
    const adjustment = await prisma.wRVUAdjustment.update({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        description: data.description,
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
        type: data.type,
        category: data.category,
        status: data.status
      }
    });

    return NextResponse.json(adjustment);
  } catch (error) {
    console.error('Error updating wRVU adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to update wRVU adjustment' },
      { status: 500 }
    );
  }
}

// DELETE /api/wrvu-adjustments - Delete wRVU adjustments
export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be an array' },
        { status: 400 }
      );
    }

    await prisma.wRVUAdjustment.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({ message: 'Adjustments deleted successfully' });
  } catch (error) {
    console.error('Error deleting wRVU adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to delete wRVU adjustments' },
      { status: 500 }
    );
  }
} 