import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface ProviderUploadData {
  'Employee ID': string;
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Specialty': string;
  'Department': string;
  'Hire Date': string | number;
  'FTE': string | number;
  'Base Salary': string | number;
  'Compensation Model': string;
  'Clinical FTE': string | number;
  'Non-Clinical FTE': string | number;
  'Clinical Salary': string | number;
  'Non-Clinical Salary': string | number;
  'Years of Experience': string | number;
}

// Helper function to parse Excel dates
function parseExcelDate(value: string | number | Date): Date {
  // If it's already a Date object, return it
  if (value instanceof Date) {
    return value;
  }
  
  if (typeof value === 'number') {
    // Excel date serial number (days since 1900-01-01)
    // Excel's epoch starts at January 0, 1900, which is December 31, 1899
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + (value * millisecondsPerDay));
    if (!isNaN(date.getTime())) {
      return date;
    }
  } else if (typeof value === 'string') {
    // Try parsing various date formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try parsing MM/DD/YYYY format
    const parts = value.split(/[/-]/);
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // If all parsing attempts fail, throw an error
  throw new Error(`Invalid date format: ${value}`);
}

// Helper function to clean and validate numeric values
function cleanNumber(value: string | number | null | undefined, fieldName: string): number {
  if (value === null || value === undefined || value === '') {
    console.warn(`Empty value for ${fieldName}, defaulting to 0`);
    return 0;
  }

  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else {
    // Remove currency symbols, commas, and spaces
    const cleanStr = value.toString().replace(/[$,\s]/g, '').trim();
    
    // Handle percentage format (e.g., "50%")
    if (cleanStr.endsWith('%')) {
      numValue = parseFloat(cleanStr.slice(0, -1)) / 100;
    } else {
      numValue = parseFloat(cleanStr);
    }
  }

  if (isNaN(numValue)) {
    console.warn(`Invalid number format for ${fieldName}: ${value}, defaulting to 0`);
    return 0;
  }

  return numValue;
}

export async function POST(request: Request) {
  try {
    console.log('Starting provider upload process');
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

    // If mode is 'clear', delete all existing provider data
    if (mode === 'clear') {
      try {
        await prisma.provider.deleteMany();
        console.log('Cleared existing provider data');
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
    let workbook;
    try {
      workbook = XLSX.read(bytes, { 
        type: 'array',
        cellDates: false,  // Get raw date values
        raw: true,         // Get raw values
        dateNF: 'yyyy-mm-dd'  // Date format string
      });
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
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: true, // Get raw values instead of formatted strings
      defval: null,
      blankrows: false,
      header: 1 // Use 1-based array of values
    }) as any[];

    // Skip the header row and map to object structure
    const rows = data.slice(1).map(row => ({
      'Employee ID': row[0],
      'First Name': row[1],
      'Last Name': row[2],
      'Email': row[3],
      'Specialty': row[4],
      'Department': row[5],
      'Hire Date': row[6],
      'FTE': row[7],
      'Base Salary': row[8],
      'Compensation Model': row[9],
      'Clinical FTE': row[10],
      'Non-Clinical FTE': row[11],
      'Clinical Salary': row[12],
      'Non-Clinical Salary': row[13],
      'Years of Experience': row[14]
    }));

    console.log('Processing data rows:', rows.length);

    const errors: string[] = [];
    const successes: string[] = [];

    // Process each row
    for (const row of rows) {
      try {
        const employeeId = row['Employee ID']?.toString();
        
        if (!employeeId) {
          console.warn('Skipping row without Employee ID');
          continue;
        }

        // Parse hire date properly
        let hireDate: Date;
        try {
          console.log(`Raw hire date for ${employeeId}:`, row['Hire Date']);
          hireDate = parseExcelDate(row['Hire Date']);
          console.log(`Parsed hire date for ${employeeId}:`, hireDate.toISOString());
        } catch (dateError) {
          console.error(`Date parsing error for ${employeeId}:`, dateError);
          errors.push(`Invalid hire date for ${employeeId}: ${row['Hire Date']}`);
          continue;
        }

        // Clean and validate numeric fields with detailed logging
        const fte = cleanNumber(row['FTE'], 'FTE');
        const clinicalFte = cleanNumber(row['Clinical FTE'], 'Clinical FTE');
        const nonClinicalFte = cleanNumber(row['Non-Clinical FTE'], 'Non-Clinical FTE');
        const baseSalary = cleanNumber(row['Base Salary'], 'Base Salary');
        const clinicalSalary = cleanNumber(row['Clinical Salary'], 'Clinical Salary');
        const nonClinicalSalary = cleanNumber(row['Non-Clinical Salary'], 'Non-Clinical Salary');
        const yearsOfExperience = cleanNumber(row['Years of Experience'], 'Years of Experience');

        // Log raw values for debugging
        console.log('Raw row values:', row);
        console.log(`Provider ${employeeId} parsed values:`, {
          fte,
          clinicalFte,
          nonClinicalFte,
          baseSalary,
          clinicalSalary,
          nonClinicalSalary,
          yearsOfExperience,
          hireDate: hireDate.toISOString()
        });

        const providerData = {
          employeeId,
          firstName: row['First Name']?.toString() || '',
          lastName: row['Last Name']?.toString() || '',
          email: row['Email']?.toString() || `${employeeId.toLowerCase()}@example.com`,
          specialty: row['Specialty']?.toString() || '',
          department: row['Department']?.toString() || '',
          hireDate,
          fte,
          clinicalFte,
          nonClinicalFte,
          baseSalary,
          clinicalSalary,
          nonClinicalSalary,
          yearsOfExperience,
          compensationModel: row['Compensation Model']?.toString() || 'Standard'
        };

        const provider = await prisma.provider.upsert({
          where: { employeeId },
          update: providerData,
          create: providerData
        });
        
        successes.push(`Successfully processed data for ${providerData.firstName} ${providerData.lastName} (${employeeId})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const employeeId = row['Employee ID']?.toString() || 'Unknown';
        errors.push(`Error processing row for ${employeeId}: ${errorMessage}`);
        console.error(`Error processing row:`, { error, row });
      }
    }

    console.log(`Completed processing. Provider rows: ${rows.length}, Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Upload errors:', errors);
    }

    return NextResponse.json({
      message: `Successfully uploaded ${rows.length} records`,
      count: rows.length,
      successes,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading provider data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload provider data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 