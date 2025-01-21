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

interface WRVURecord {
  id: string;
  year: number;
  month: number;
  value: number;
  hours: number;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  history: WRVUHistory[];
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

interface WRVUResponse {
  id: string;
  providerId: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  year: number;
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
    const transformedData: WRVUResponse[] = allProviders.map(provider => {
      // Initialize base provider data
      const response: WRVUResponse = {
        id: provider.id,
        providerId: provider.id,
        employee_id: provider.employeeId,
        first_name: provider.firstName,
        last_name: provider.lastName,
        specialty: provider.specialty,
        year,
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
        history: []
      };

      // Process wRVU data if it exists
      if (provider.wrvuData && provider.wrvuData.length > 0) {
        // Set monthly values
        provider.wrvuData.forEach(record => {
          switch (record.month) {
            case 1: response.jan = record.value; break;
            case 2: response.feb = record.value; break;
            case 3: response.mar = record.value; break;
            case 4: response.apr = record.value; break;
            case 5: response.may = record.value; break;
            case 6: response.jun = record.value; break;
            case 7: response.jul = record.value; break;
            case 8: response.aug = record.value; break;
            case 9: response.sep = record.value; break;
            case 10: response.oct = record.value; break;
            case 11: response.nov = record.value; break;
            case 12: response.dec = record.value; break;
          }

          // Add history entries
          if (record.history && record.history.length > 0) {
            response.history.push(...record.history);
          }
        });

        // Sort history by date
        response.history.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
      }

      return response;
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
function getMonthKey(month: number): keyof Pick<WRVUDataWithHistory, 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec'> | undefined {
  const monthMap: Record<number, keyof Pick<WRVUDataWithHistory, 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec'>> = {
    1: 'jan', 2: 'feb', 3: 'mar', 4: 'apr', 5: 'may', 6: 'jun',
    7: 'jul', 8: 'aug', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dec'
  };
  return monthMap[month];
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employee_id, year, ...monthlyData } = data;

    console.log('API received request:', {
      employee_id,
      year,
      monthlyData
    });

    // Validate required fields
    if (!employee_id || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id and year are required' },
        { status: 400 }
      );
    }

    // Find provider with exact match
    const provider = await prisma.provider.findFirst({
      where: {
        employeeId: employee_id
      }
    });

    console.log('API found provider:', provider);

    if (!provider) {
      return NextResponse.json(
        { error: `Provider not found with ID: ${employee_id}` },
        { status: 404 }
      );
    }

    // Convert monthly values to numbers and validate
    const monthlyValues: Record<string, number> = Object.entries(monthlyData).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: typeof value === 'string' ? parseFloat(value) : Number(value)
    }), {} as Record<string, number>);

    console.log('Processed monthly values:', monthlyValues);

    try {
      // Create or update wRVU records for each month with data
      const upsertPromises = Object.entries(monthlyValues)
        .filter(([_, value]) => value > 0)
        .map(([month, value]) => {
          const monthNumber = getMonthNumber(month);
          return prisma.wRVUData.upsert({
            where: {
              providerId_year_month: {
                providerId: provider.id,
                year: Number(year),
                month: monthNumber
              }
            },
            create: {
              providerId: provider.id,
              year: Number(year),
              month: monthNumber,
              value: value,
              hours: 160
            },
            update: {
              value: value,
              hours: 160
            }
          });
        });

      const results = await Promise.all(upsertPromises);
      console.log('Created/Updated wRVU records:', results);
      
      return NextResponse.json({ data: results });
    } catch (dbError) {
      console.error('Database error:', dbError);
      if (dbError instanceof Error) {
        if (dbError.message.includes('Unique constraint')) {
          return NextResponse.json(
            { error: 'wRVU data already exists for this provider, year, and month', details: dbError.message },
            { status: 409 }
          );
        }
      }
      return NextResponse.json(
        { error: 'Failed to create wRVU data records', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to get month number from month key
function getMonthNumber(month: string): number {
  const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  return monthMap[month] || 0;
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
    const months = [
      { key: 'jan', month: 1 },
      { key: 'feb', month: 2 },
      { key: 'mar', month: 3 },
      { key: 'apr', month: 4 },
      { key: 'may', month: 5 },
      { key: 'jun', month: 6 },
      { key: 'jul', month: 7 },
      { key: 'aug', month: 8 },
      { key: 'sep', month: 9 },
      { key: 'oct', month: 10 },
      { key: 'nov', month: 11 },
      { key: 'dec', month: 12 }
    ];
    
    const updatedRecords: WRVURecord[] = [];
    
    for (const { key, month } of months) {
      const newValue = parseFloat(monthlyData[key]) || 0;

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
            fieldName: key,
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
      }) as WRVURecord;

      updatedRecords.push(record);
    }

    // Transform to response format
    const response: WRVUResponse = {
      id: provider.id,
      providerId: provider.id,
      employee_id: provider.employeeId,
      first_name: provider.firstName,
      last_name: provider.lastName,
      specialty: provider.specialty,
      year,
      jan: updatedRecords[0].value,
      feb: updatedRecords[1].value,
      mar: updatedRecords[2].value,
      apr: updatedRecords[3].value,
      may: updatedRecords[4].value,
      jun: updatedRecords[5].value,
      jul: updatedRecords[6].value,
      aug: updatedRecords[7].value,
      sep: updatedRecords[8].value,
      oct: updatedRecords[9].value,
      nov: updatedRecords[10].value,
      dec: updatedRecords[11].value,
      history: updatedRecords.flatMap(record => record.history)
        .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    };

    return NextResponse.json(response);
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

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No valid provider IDs provided' },
        { status: 400 }
      );
    }

    // Delete all related data in a transaction
    await prisma.$transaction(async (prisma) => {
      // First delete all history entries for these providers
      await prisma.wRVUHistory.deleteMany({
        where: {
          wrvuData: {
            providerId: {
              in: ids
            }
          }
        }
      });

      // Then delete all wRVU data entries for these providers
      await prisma.wRVUData.deleteMany({
        where: {
          providerId: {
            in: ids
          }
        }
      });

      // Finally delete the provider records
      await prisma.provider.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to delete wRVU data' },
      { status: 500 }
    );
  }
} 