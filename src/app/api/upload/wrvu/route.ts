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
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
        await prisma.wRVUHistory.deleteMany({
          where: { wrvuData: { year: 2024 } }
        });
        await prisma.wRVUData.deleteMany({
          where: { year: 2024 }
        });
        console.log('Cleared existing wRVU data and history for year: 2024');
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
    const rawData = XLSX.utils.sheet_to_json<WRVURow>(worksheet, {
      raw: true,
      defval: 0,
      blankrows: false
    });

    console.log('Parsed data:', rawData[0]); // Log first row for debugging

    // Process each row
    const successes: string[] = [];
    const errors: string[] = [];
    let totalRecordsCreated = 0;

    for (const row of rawData) {
      try {
        const employeeId = String(row.employee_id || '');
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

        // Get the year from the data, defaulting to 2024
        const year = 2024;
        
        // Process each month's data
        for (let monthIndex = 0; monthIndex < MONTHS.length; monthIndex++) {
          const monthName = MONTHS[monthIndex];
          const value = Number(row[monthName]);
          
          // Skip if value is 0 or invalid
          if (isNaN(value) || value <= 0) continue;

          // Create or update wRVU data for the month
          await prisma.wRVUData.upsert({
            where: {
              providerId_year_month: {
                providerId: provider.id,
                year,
                month: monthIndex + 1
              }
            },
            update: {
              value,
              hours: 160
            },
            create: {
              providerId: provider.id,
              year,
              month: monthIndex + 1,
              value,
              hours: 160
            }
          });
          totalRecordsCreated++;
        }
        
        successes.push(`Successfully processed data for ${row.first_name} ${row.last_name} (${employeeId})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const employeeId = String(row.employee_id || 'Unknown');
        errors.push(`Error processing row for ${employeeId}: ${errorMessage}`);
        console.error(`Error processing row:`, { error, row });
      }
    }

    console.log(`Completed processing. Rows processed: ${rawData.length}, Records created/updated: ${totalRecordsCreated}, Errors: ${errors.length}`);

    // Disconnect from database
    try {
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }

    return NextResponse.json({
      message: `Successfully processed ${rawData.length} providers with ${totalRecordsCreated} monthly records`,
      providers: rawData.length,
      records: totalRecordsCreated,
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