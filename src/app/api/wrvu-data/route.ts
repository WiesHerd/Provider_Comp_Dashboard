import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface WRVUHistory {
  id: string;
  wrvuDataId: string;
  changeType: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: Date;
  changedBy: string | null;
}

interface WRVUDataWithHistory {
  id: string;
  providerId: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  history: WRVUHistory[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2024');
    
    console.log('\n=== Starting GET request ===');
    console.log('Fetching wRVU data for year:', year);

    // Step 1: Get all providers first
    const allProviders = await prisma.provider.findMany({
      orderBy: { lastName: 'asc' },
      include: {
        wrvuData: {
          where: { year },
          include: {
            history: {
              orderBy: { changedAt: 'desc' }
            }
          }
        }
      }
    });

    console.log('\n=== Step 1: All Providers ===');
    console.log('Total providers:', allProviders.length);

    // Step 2: Transform data
    const transformedData: WRVUDataWithHistory[] = allProviders.map(provider => {
      // Initialize base provider data
      const providerData: WRVUDataWithHistory = {
        id: provider.id,
        providerId: provider.id,
        employee_id: provider.employeeId,
        first_name: provider.firstName,
        last_name: provider.lastName,
        specialty: provider.specialty,
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
        history: []
      };

      // Process wRVU data if it exists
      if (provider.wrvuData && provider.wrvuData.length > 0) {
        // Set monthly values
        provider.wrvuData.forEach(record => {
          const monthKey = getMonthKey(record.month);
          if (monthKey) {
            providerData[monthKey] = record.value;
          }

          // Add history entries
          if (record.history && record.history.length > 0) {
            providerData.history.push(
              ...record.history.map(h => ({
                ...h,
                changedAt: new Date(h.changedAt)
              }))
            );
          }
        });

        // Sort history by date
        providerData.history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
      }

      return providerData;
    });

    console.log('\n=== Step 2: Final Data ===');
    console.log('Total records in response:', transformedData.length);
    if (transformedData.length > 0) {
      const sample = transformedData[0];
      console.log('First record in response:', {
        name: `${sample.first_name} ${sample.last_name}`,
        jan: sample.jan,
        history: sample.history.length
      });
    }

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Failed to fetch wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wRVU data' },
      { status: 500 }
    );
  }
}

// Helper function to get month key
function getMonthKey(month: number): keyof WRVUDataWithHistory | undefined {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
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

    console.log('Received update request:', { id, providerId, year, monthlyData });

    // First, verify the provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId || id }
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Get or create wRVU records for each month
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
    const updatedRecords = [];
    
    for (const [index, monthKey] of months.entries()) {
      const month = index + 1;
      const newValue = parseFloat(monthlyData[monthKey]) || 0;

      // Get existing record
      const existingRecord = await prisma.wRVUData.findUnique({
        where: {
          providerId_year_month: {
            providerId: provider.id,
            year,
            month
          }
        }
      });

      // Only update if value has changed
      if (existingRecord && existingRecord.value !== newValue) {
        // Create history entry
        await prisma.wRVUHistory.create({
          data: {
            wrvuDataId: existingRecord.id,
            changeType: 'UPDATE',
            fieldName: monthKey,
            oldValue: String(existingRecord.value),
            newValue: String(newValue),
            changedAt: new Date(),
            changedBy: 'system'
          }
        });
      }

      // Update or create record
      const record = await prisma.wRVUData.upsert({
        where: {
          providerId_year_month: {
            providerId: provider.id,
            year,
            month
          }
        },
        create: {
          providerId: provider.id,
          year,
          month,
          value: newValue,
          hours: 160
        },
        update: {
          value: newValue,
          hours: 160
        },
        include: {
          history: {
            orderBy: {
              changedAt: 'desc'
            }
          }
        }
      });

      updatedRecords.push(record);
    }

    // Fetch the complete updated data
    const updatedData = await prisma.provider.findUnique({
      where: { id: provider.id },
      include: {
        wrvuData: {
          where: { year },
          include: {
            history: {
              orderBy: {
                changedAt: 'desc'
              }
            }
          }
        }
      }
    });

    // Transform the data to match the expected format
    const transformedData: WRVUDataWithHistory = {
      id: provider.id,
      providerId: provider.id,
      employee_id: provider.employeeId,
      first_name: provider.firstName,
      last_name: provider.lastName,
      specialty: provider.specialty,
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
      history: []
    };

    // Set the monthly values and collect history
    if (updatedData?.wrvuData) {
      updatedData.wrvuData.forEach(record => {
        const monthKey = getMonthKey(record.month);
        if (monthKey) {
          transformedData[monthKey] = record.value;
        }
        if (record.history) {
          transformedData.history.push(...record.history.map(h => ({
            ...h,
            changedAt: new Date(h.changedAt)
          })));
        }
      });
    }

    // Sort history by date
    transformedData.history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error updating wRVU data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update wRVU data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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