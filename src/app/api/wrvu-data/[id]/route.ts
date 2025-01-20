import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const { providerId, year, monthlyData } = data;

    console.log('Received update request:', { providerId, year, monthlyData });

    // First, verify the provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    console.log('Found provider:', provider);

    // Get existing records for this provider and year
    const existingRecords = await prisma.wRVUData.findMany({
      where: {
        providerId: provider.id,
        year
      }
    });

    console.log('Existing records:', existingRecords);

    // Process each month's data
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const historyEntries: Array<{
      wrvuDataId: string;
      changeType: string;
      fieldName: string;
      oldValue: string | null;
      newValue: string;
      changedAt: Date;
    }> = [];
    
    for (const [index, monthKey] of months.entries()) {
      const month = index + 1;
      const newValue = parseFloat(monthlyData[monthKey]) || 0;
      const existingRecord = existingRecords.find(r => r.month === month);

      console.log(`Processing ${monthKey}:`, {
        month,
        newValue,
        existingValue: existingRecord?.value
      });

      if (existingRecord) {
        // If value changed, create history entry
        if (existingRecord.value !== newValue) {
          console.log(`Value changed for ${monthKey}:`, {
            old: existingRecord.value,
            new: newValue
          });

          historyEntries.push({
            wrvuDataId: existingRecord.id,
            changeType: 'UPDATE',
            fieldName: monthKey,
            oldValue: String(existingRecord.value),
            newValue: String(newValue),
            changedAt: new Date()
          });

          // Update the record
          await prisma.wRVUData.update({
            where: { id: existingRecord.id },
            data: { value: newValue }
          });
        }
      } else {
        console.log(`Creating new record for ${monthKey}`);
        // Create new record
        const newRecord = await prisma.wRVUData.create({
          data: {
            providerId: provider.id,
            year,
            month,
            value: newValue,
            hours: 160
          }
        });

        historyEntries.push({
          wrvuDataId: newRecord.id,
          changeType: 'CREATE',
          fieldName: monthKey,
          oldValue: null,
          newValue: String(newValue),
          changedAt: new Date()
        });
      }
    }

    console.log('History entries to create:', historyEntries);

    // Create history entries if there are any changes
    if (historyEntries.length > 0) {
      await prisma.wRVUHistory.createMany({
        data: historyEntries
      });
    }

    // Get the updated records with history
    const updatedRecords = await prisma.wRVUData.findMany({
      where: {
        providerId: provider.id,
        year
      },
      include: {
        history: {
          orderBy: {
            changedAt: 'desc'
          },
          take: 5
        }
      }
    });

    console.log('Updated records:', updatedRecords);

    // Transform to response format
    const response = {
      id: provider.id,
      providerId: provider.id,
      employee_id: provider.employeeId,
      first_name: provider.firstName,
      last_name: provider.lastName,
      specialty: provider.specialty,
      year,
      ...months.reduce((acc, month, index) => {
        const record = updatedRecords.find(r => r.month === index + 1);
        acc[month] = record ? record.value : 0;
        return acc;
      }, {} as Record<string, number>),
      history: updatedRecords
        .flatMap(record => record.history)
        .map(h => ({
          ...h,
          changedAt: h.changedAt.toISOString()
        }))
        .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
        .slice(0, 5)
    };

    console.log('Sending response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to update wRVU data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update wRVU data' },
      { status: 500 }
    );
  }
} 