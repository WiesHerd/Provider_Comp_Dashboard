import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2024');
    
    // Get all wRVU data for the year
    const wrvuRecords = await prisma.wRVUData.findMany({
      where: { year },
      include: {
        provider: true,
        history: {
          orderBy: { changedAt: 'desc' },
          take: 5
        }
      },
      orderBy: {
        provider: {
          lastName: 'asc'
        }
      }
    });

    // Transform the data to match the frontend format
    const transformedData = wrvuRecords.reduce((acc: any[], record) => {
      const existingRecord = acc.find(r => r.employee_id === record.provider.employeeId);
      
      if (existingRecord) {
        // Update the existing record with the month's value
        existingRecord[getMonthKey(record.month)] = record.value;
      } else {
        // Create a new record
        const newRecord = {
          id: record.provider.id,
          employee_id: record.provider.employeeId,
          first_name: record.provider.firstName,
          last_name: record.provider.lastName,
          specialty: record.provider.specialty,
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
          history: record.history
        };
        newRecord[getMonthKey(record.month)] = record.value;
        acc.push(newRecord);
      }
      return acc;
    }, []);

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Failed to fetch wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wRVU data' },
      { status: 500 }
    );
  }
}

// Helper function to get month key
function getMonthKey(month: number): string {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return months[month - 1];
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const currentYear = new Date().getFullYear();

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

    // Create wRVU data for each month
    const monthlyData = {
      1: data.jan || 0,
      2: data.feb || 0,
      3: data.mar || 0,
      4: data.apr || 0,
      5: data.may || 0,
      6: data.jun || 0,
      7: data.jul || 0,
      8: data.aug || 0,
      9: data.sep || 0,
      10: data.oct || 0,
      11: data.nov || 0,
      12: data.dec || 0
    };

    // Create all monthly records
    const wrvuData = await Promise.all(
      Object.entries(monthlyData).map(([month, value]) =>
        prisma.wRVUData.upsert({
          where: {
            providerId_year_month: {
              providerId: provider.id,
              year: currentYear,
              month: parseInt(month)
            }
          },
          create: {
            year: currentYear,
            month: parseInt(month),
            value,
            hours: 160,
            providerId: provider.id
          },
          update: {
            value,
            hours: 160
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: wrvuData.length });
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
    const { id, providerId, year, ...monthlyData } = data;

    // Get the provider's current wRVU records for all months
    const currentRecords = await prisma.wRVUData.findMany({
      where: {
        providerId,
        year
      }
    });

    // Create a map of month number to record
    const recordMap = currentRecords.reduce((acc, record) => {
      acc[record.month] = record;
      return acc;
    }, {} as Record<number, any>);

    // Process each month's data
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const updates = months.map(async (monthKey, index) => {
      const month = index + 1;
      const value = monthlyData[monthKey] || 0;
      const existingRecord = recordMap[month];

      if (existingRecord) {
        // If value changed, create history record
        if (existingRecord.value !== value) {
          await prisma.wRVUHistory.create({
            data: {
              wrvuDataId: existingRecord.id,
              changeType: 'UPDATE',
              fieldName: monthKey,
              oldValue: String(existingRecord.value),
              newValue: String(value),
              changedAt: new Date()
            }
          });

          // Update existing record
          return prisma.wRVUData.update({
            where: { id: existingRecord.id },
            data: { value }
          });
        }
        return existingRecord;
      } else {
        // Create new record with history
        const newRecord = await prisma.wRVUData.create({
          data: {
            providerId,
            year,
            month,
            value,
            hours: 160
          }
        });

        await prisma.wRVUHistory.create({
          data: {
            wrvuDataId: newRecord.id,
            changeType: 'CREATE',
            fieldName: monthKey,
            oldValue: null,
            newValue: String(value),
            changedAt: new Date()
          }
        });

        return newRecord;
      }
    });

    // Execute all updates in parallel
    await Promise.all(updates);

    // Get updated records with history
    const updatedRecords = await prisma.wRVUData.findMany({
      where: {
        providerId,
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

    return NextResponse.json({ success: true, data: updatedRecords });
  } catch (error) {
    console.error('Failed to update wRVU data:', error);
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

    // Delete wRVU data for the specified providers
    await prisma.wRVUData.deleteMany({
      where: {
        providerId: {
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