import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { WRVUAdjustmentFormData } from '@/types/wrvu-adjustment';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Updating wRVU adjustment with ID:', params.id);
    const data: WRVUAdjustmentFormData = await request.json();

    // Check if the adjustment exists
    const existingAdjustment = await prisma.wRVUAdjustment.findUnique({
      where: { id: params.id }
    });

    if (!existingAdjustment) {
      console.log('wRVU adjustment not found:', params.id);
      return NextResponse.json(
        { success: false, error: 'wRVU adjustment not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!data.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!data.providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!data.year || typeof data.year !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid year is required' },
        { status: 400 }
      );
    }

    // Create the update data
    const updateData = {
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      year: Number(data.year),
      providerId: String(data.providerId),
      jan: Number(data.monthlyValues.jan ?? 0),
      feb: Number(data.monthlyValues.feb ?? 0),
      mar: Number(data.monthlyValues.mar ?? 0),
      apr: Number(data.monthlyValues.apr ?? 0),
      may: Number(data.monthlyValues.may ?? 0),
      jun: Number(data.monthlyValues.jun ?? 0),
      jul: Number(data.monthlyValues.jul ?? 0),
      aug: Number(data.monthlyValues.aug ?? 0),
      sep: Number(data.monthlyValues.sep ?? 0),
      oct: Number(data.monthlyValues.oct ?? 0),
      nov: Number(data.monthlyValues.nov ?? 0),
      dec: Number(data.monthlyValues.dec ?? 0)
    };

    // Update the adjustment
    const updatedAdjustment = await prisma.wRVUAdjustment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        provider: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('Successfully updated wRVU adjustment:', updatedAdjustment);
    return NextResponse.json({ success: true, data: updatedAdjustment });

  } catch (error) {
    console.error('Error updating wRVU adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wRVU adjustment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting wRVU adjustment with ID:', params.id);

    // Check if the adjustment exists
    const existingAdjustment = await prisma.wRVUAdjustment.findUnique({
      where: { id: params.id }
    });

    if (!existingAdjustment) {
      console.log('wRVU adjustment not found:', params.id);
      return NextResponse.json(
        { success: false, error: 'wRVU adjustment not found' },
        { status: 404 }
      );
    }

    // Delete the adjustment
    await prisma.wRVUAdjustment.delete({
      where: { id: params.id }
    });

    console.log('Successfully deleted wRVU adjustment:', params.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting wRVU adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete wRVU adjustment' },
      { status: 500 }
    );
  }
} 