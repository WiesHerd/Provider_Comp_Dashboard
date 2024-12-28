import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface ProviderUploadData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  department: string;
  hire_date: string;
  fte: number;
  base_salary: number;
  compensation_model: string;
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

    // If mode is 'clear', delete all existing providers
    if (mode === 'clear') {
      // First delete related data
      await prisma.wRVUData.deleteMany();
      await prisma.wRVUAdjustment.deleteMany();
      await prisma.targetAdjustment.deleteMany();
      await prisma.additionalPayment.deleteMany();
      await prisma.compensationChange.deleteMany();
      // Then delete providers
      await prisma.provider.deleteMany();
      console.log('Cleared all existing provider data');
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Read file content
    const bytes = await file.arrayBuffer();
    console.log('File buffer size:', bytes.byteLength);
    
    let workbook;
    try {
      workbook = XLSX.read(bytes, { type: 'array' });
      console.log('Workbook sheets:', workbook.SheetNames);
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

    console.log('Parsed data sample:', {
      firstRecord: data?.[0],
      totalRecords: data?.length
    });

    // Validate the data array
    if (!Array.isArray(data)) {
      console.error('Data is not an array:', typeof data);
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of providers.' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      console.error('No data found in file');
      return NextResponse.json(
        { error: 'No provider data found in file.' },
        { status: 400 }
      );
    }

    // Validate each provider record
    const errors: string[] = [];
    const providers = data.map((item: ProviderUploadData, index: number) => {
      try {
        if (!item.employee_id || !item.first_name || !item.last_name) {
          throw new Error('Missing required fields');
        }

        const hireDate = new Date(item.hire_date);
        if (isNaN(hireDate.getTime())) {
          throw new Error('Invalid hire date');
        }

        const fte = Number(item.fte);
        if (isNaN(fte) || fte <= 0 || fte > 1) {
          throw new Error('Invalid FTE (must be between 0 and 1)');
        }

        const salary = Number(item.base_salary);
        if (isNaN(salary) || salary <= 0) {
          throw new Error('Invalid base salary');
        }

        return {
          employeeId: item.employee_id,
          firstName: item.first_name,
          lastName: item.last_name,
          email: item.email || `${item.first_name.toLowerCase()}.${item.last_name.toLowerCase()}@healthsystem.org`,
          specialty: item.specialty,
          department: item.department,
          hireDate: hireDate,
          fte: fte,
          baseSalary: salary,
          compensationModel: item.compensation_model || 'Standard',
          status: 'Active',
          terminationDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
        return null;
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }

    try {
      // Create the providers in the database
      console.log('Attempting to create/update providers with count:', providers.length);

      // Process providers one by one to handle duplicates
      const results = await Promise.all(
        providers.map(async (provider) => {
          try {
            return await prisma.provider.upsert({
              where: { employeeId: provider.employeeId },
              update: {
                firstName: provider.firstName,
                lastName: provider.lastName,
                email: provider.email,
                specialty: provider.specialty,
                department: provider.department,
                hireDate: provider.hireDate,
                fte: provider.fte,
                baseSalary: provider.baseSalary,
                compensationModel: provider.compensationModel,
                status: provider.status,
                terminationDate: provider.terminationDate,
                updatedAt: new Date()
              },
              create: provider
            });
          } catch (error) {
            console.error(`Error processing provider ${provider.employeeId}:`, error);
            return null;
          }
        })
      );

      const successfulUploads = results.filter(result => result !== null);
      console.log('Upload successful:', {
        total: providers.length,
        successful: successfulUploads.length
      });

      return NextResponse.json({
        message: `Successfully processed ${successfulUploads.length} providers`,
        count: successfulUploads.length
      });
    } catch (dbError) {
      console.error('Database error:', dbError instanceof Error ? dbError.message : 'Unknown error');
      
      // Check for specific error types
      const errorMessage = dbError instanceof Error 
        ? dbError.message
        : 'Failed to save providers to database. Please try again.';
      
      return NextResponse.json(
        { 
          error: 'Database Error',
          message: errorMessage
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading providers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 