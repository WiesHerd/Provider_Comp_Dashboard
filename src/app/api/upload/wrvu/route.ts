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

    // If mode is 'clear', delete all existing wRVU data for the current year
    const currentYear = new Date().getFullYear();
    if (mode === 'clear') {
      await prisma.wRVUData.deleteMany({
        where: { year: currentYear }
      });
      console.log('Cleared existing wRVU data for year:', currentYear);
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    let workbook;
    try {
      workbook = XLSX.read(bytes, { type: 'array' });
    } catch (e) {
      console.error('Error reading file:', e);
      return NextResponse.json(
        { error: 'Could not read file. Please ensure it is a valid Excel or CSV file.' },
        { status: 400 }
      );
    }
    
    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON with header mapping
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: 0,  // Default value for empty cells
      blankrows: false  // Skip blank rows
    }) as WRVURow[];

    console.log('Processing data rows:', rawData.length);

    let totalRecords = 0;
    const errors: string[] = [];
    const successes: string[] = [];

    // Process each row
    for (const row of rawData) {
      try {
        const employeeId = row.employee_id?.toString();
        
        if (!employeeId) {
          console.warn('Skipping row without employee_id');
          continue;
        }

        // Find or create the provider
        const provider = await prisma.provider.upsert({
          where: { employeeId },
          update: {
            firstName: row.first_name?.toString() || '',
            lastName: row.last_name?.toString() || '',
            specialty: row.specialty?.toString() || '',
            // Set default values for required fields if not already set
            email: `${employeeId.toLowerCase()}@example.com`,
            department: row.specialty?.toString() || 'Unknown',
            hireDate: new Date(),
            fte: 1.0,
            baseSalary: 0,
            compensationModel: 'Standard'
          },
          create: {
            employeeId,
            firstName: row.first_name?.toString() || '',
            lastName: row.last_name?.toString() || '',
            specialty: row.specialty?.toString() || '',
            email: `${employeeId.toLowerCase()}@example.com`,
            department: row.specialty?.toString() || 'Unknown',
            hireDate: new Date(),
            fte: 1.0,
            baseSalary: 0,
            compensationModel: 'Standard'
          }
        });

        // Create or update wRVU data for each month
        for (const [monthName, monthNum] of Object.entries(MONTHS)) {
          const rawValue = row[monthName];
          const value = typeof rawValue === 'number' 
            ? rawValue 
            : typeof rawValue === 'string' 
              ? parseFloat(rawValue) || 0 
              : 0;
          
          if (value > 0) {  // Only create/update records with actual values
            await prisma.wRVUData.upsert({
              where: {
                providerId_year_month: {
                  providerId: provider.id,
                  year: currentYear,
                  month: monthNum
                }
              },
              update: {
                value,
                hours: 160 // Default to standard month hours
              },
              create: {
                providerId: provider.id,
                year: currentYear,
                month: monthNum,
                value,
                hours: 160 // Default to standard month hours
              }
            });
            totalRecords++;
          }
        }
        
        successes.push(`Successfully processed data for ${row.first_name} ${row.last_name} (${employeeId})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const employeeId = row.employee_id?.toString() || 'Unknown';
        errors.push(`Error processing row for ${employeeId}: ${errorMessage}`);
        console.error(`Error processing row:`, { error, row });
      }
    }

    console.log(`Completed processing. Provider rows: ${rawData.length}, Errors: ${errors.length}`);

    return NextResponse.json({
      message: `Successfully uploaded ${rawData.length} records`,
      count: rawData.length,
      successes,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading wRVU data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload wRVU data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 