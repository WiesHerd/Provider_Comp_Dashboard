import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface ProviderUploadData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  department: string;
  hire_date: string;
  fte: string | number;
  base_salary: string | number;
  compensation_model: string;
  clinical_fte: string | number;
  non_clinical_fte: string | number;
  clinical_salary: string | number;
  non_clinical_salary: string | number;
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
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd',
      defval: ''
    }) as ProviderUploadData[];

    console.log('Processing data rows:', data.length);

    const errors: string[] = [];
    const successes: string[] = [];

    // Process each row
    for (const item of data) {
      try {
        const cleanNumber = (value: string | number) => {
          if (typeof value === 'string') {
            return Number(value.replace(/[$,]/g, ''));
          }
          return Number(value);
        };

        const employeeId = item.employee_id?.toString();
        
        if (!employeeId) {
          console.warn('Skipping row without employee_id');
          continue;
        }

        // Parse hire date
        let hireDate = new Date(item.hire_date);
        if (isNaN(hireDate.getTime())) {
          console.warn(`Invalid hire date for ${employeeId}, using current date`);
          hireDate = new Date();
        }

        // Clean and validate numeric fields
        const providerData = {
          employeeId,
          firstName: item.first_name?.toString() || '',
          lastName: item.last_name?.toString() || '',
          email: item.email?.toString() || `${employeeId.toLowerCase()}@example.com`,
          specialty: item.specialty?.toString() || '',
          department: item.department?.toString() || '',
          hireDate,
          fte: cleanNumber(item.fte || 0),
          baseSalary: cleanNumber(item.base_salary || 0),
          compensationModel: item.compensation_model?.toString() || 'Standard',
          clinicalFte: cleanNumber(item.clinical_fte || 0),
          nonClinicalFte: cleanNumber(item.non_clinical_fte || 0),
          clinicalSalary: cleanNumber(item.clinical_salary || 0),
          nonClinicalSalary: cleanNumber(item.non_clinical_salary || 0)
        };

        const provider = await prisma.provider.upsert({
          where: { employeeId },
          update: providerData,
          create: providerData
        });
        
        successes.push(`Successfully processed data for ${item.first_name} ${item.last_name} (${employeeId})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const employeeId = item.employee_id?.toString() || 'Unknown';
        errors.push(`Error processing row for ${employeeId}: ${errorMessage}`);
        console.error(`Error processing row:`, { error, item });
      }
    }

    console.log(`Completed processing. Provider rows: ${data.length}, Errors: ${errors.length}`);

    // Disconnect from database
    try {
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }

    return NextResponse.json({
      message: `Successfully uploaded ${data.length} records`,
      count: data.length,
      successes,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading provider data:', error);
    
    // Ensure database connection is closed even on error
    try {
      await prisma.$disconnect();
      console.log('Database connection closed after error');
    } catch (disconnectError) {
      console.error('Error disconnecting from database after error:', disconnectError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to upload provider data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 