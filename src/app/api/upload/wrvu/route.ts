import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface WRVURow {
  employee_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  Jan: string | number;
  Feb: string | number;
  Mar: string | number;
  Apr: string | number;
  May: string | number;
  Jun: string | number;
  Jul: string | number;
  Aug: string | number;
  Sep: string | number;
  Oct: string | number;
  Nov: string | number;
  Dec: string | number;
  [key: string]: any;
}

const MONTHS = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

export async function POST(request: Request) {
  try {
    console.log('Starting wRVU data upload process');
    const formData = await request.formData();
    const file = formData.get('file');
    const mode = formData.get('mode') as string || 'append';

    if (!file || !(file instanceof File)) {
      console.error('No file found in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection established');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // If mode is 'clear', delete all existing wRVU data for the current year
    if (mode === 'clear') {
      try {
        await prisma.wRVUData.deleteMany({
          where: { year: 2024 }  // Hardcode to 2024 since that's our target year
        });
        console.log('Cleared existing wRVU data for year: 2024');
      } catch (clearError) {
        console.error('Error clearing existing data:', clearError);
        return NextResponse.json(
          { 
            error: 'Failed to clear existing data',
            details: clearError instanceof Error ? clearError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: 0,
      blankrows: false,
      header: 1
    });

    // Process each row
    const successes: string[] = [];
    const errors: string[] = [];
    let totalRecords = 0;

    // Skip header row
    for (const row of rawData.slice(1) as any[]) {
      try {
        const employeeId = String(row[0] || '');
        if (!employeeId) {
          console.log('Skipping row with no employee ID');
          continue;
        }

        // Find the provider
        const provider = await prisma.provider.findUnique({
          where: { employeeId }
        });

        if (!provider) {
          errors.push(`Provider not found for employee ID: ${employeeId}`);
          continue;
        }

        // Get the year from the data, defaulting to 2024 if not provided
        const year = 2024;  // Hardcode to 2024 since that's our target year
        
        // Create or update wRVU data for each month
        const monthlyData = {
          1: Number(row[5] || 0),  // Jan
          2: Number(row[6] || 0),  // Feb
          3: Number(row[7] || 0),  // Mar
          4: Number(row[8] || 0),  // Apr
          5: Number(row[9] || 0),  // May
          6: Number(row[10] || 0), // Jun
          7: Number(row[11] || 0), // Jul
          8: Number(row[12] || 0), // Aug
          9: Number(row[13] || 0), // Sep
          10: Number(row[14] || 0), // Oct
          11: Number(row[15] || 0), // Nov
          12: Number(row[16] || 0)  // Dec
        };

        // Create or update wRVU data for each month
        for (const [month, value] of Object.entries(monthlyData)) {
          if (value > 0) {  // Only create/update records with actual values
            await prisma.wRVUData.upsert({
              where: {
                providerId_year_month: {
                  providerId: provider.id,
                  year,
                  month: parseInt(month)
                }
              },
              update: {
                value,
                hours: 160
              },
              create: {
                providerId: provider.id,
                year,
                month: parseInt(month),
                value,
                hours: 160
              }
            });
            totalRecords++;
          }
        }
        
        successes.push(`Successfully processed data for ${String(row[1])} ${String(row[2])} (${employeeId})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const employeeId = String(row[0] || 'Unknown');
        errors.push(`Error processing row for ${employeeId}: ${errorMessage}`);
        console.error(`Error processing row:`, { error, row });
      }
    }

    console.log(`Completed processing. Provider rows: ${rawData.length}, Errors: ${errors.length}`);

    // Disconnect from database
    try {
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }

    return NextResponse.json({
      message: `Successfully uploaded ${rawData.length} records`,
      count: rawData.length,
      successes,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading wRVU data:', error);
    
    // Ensure database connection is closed even on error
    try {
      await prisma.$disconnect();
      console.log('Database connection closed after error');
    } catch (disconnectError) {
      console.error('Error disconnecting from database after error:', disconnectError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to upload wRVU data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 