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
  fte: string;
  base_salary: string;
  compensation_model: string;
  clinical_fte: string;
  non_clinical_fte: string;
  clinical_salary: string;
  non_clinical_salary: string;
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

    // Read file content
    const bytes = await file.arrayBuffer();
    
    let workbook;
    try {
      workbook = XLSX.read(bytes, { type: 'array', cellDates: true });
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
      raw: false,
      defval: ''
    }) as ProviderUploadData[];

    console.log('Raw data sample:', {
      firstRecord: rawData?.[0],
      totalRecords: rawData?.length
    });

    // Validate the data array
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return NextResponse.json(
        { error: 'No provider data found in file.' },
        { status: 400 }
      );
    }

    // Validate and transform each provider record
    const errors: string[] = [];
    const providers = rawData.map((item: ProviderUploadData, index: number) => {
      try {
        if (!item.employee_id || !item.first_name || !item.last_name) {
          throw new Error('Missing required fields (employee_id, first_name, last_name)');
        }

        // Parse hire date correctly
        let hireDate;
        if (item.hire_date) {
          // First try parsing as a regular date string
          hireDate = new Date(item.hire_date);
          
          // If that fails, try parsing as Excel serial number
          if (isNaN(hireDate.getTime()) || hireDate.getFullYear() === 1899) {
            const serialDate = Number(item.hire_date);
            if (!isNaN(serialDate)) {
              // Excel dates are number of days since 1/1/1900
              // Add days to 1/1/1900 to get the actual date
              const excelEpoch = new Date(1900, 0, 1);
              hireDate = new Date(excelEpoch.getTime() + ((serialDate - 1) * 24 * 60 * 60 * 1000));
            }
          }

          // Log the date parsing process
          console.log('Date parsing details:', {
            employeeId: item.employee_id,
            originalValue: item.hire_date,
            valueType: typeof item.hire_date,
            parsedDate: hireDate,
            parsedYear: hireDate?.getFullYear()
          });

          // If we still don't have a valid date, use current date
          if (isNaN(hireDate?.getTime()) || hireDate.getFullYear() === 1899) {
            console.warn(`Invalid hire date for ${item.employee_id}: ${item.hire_date}, using current date`);
            hireDate = new Date();
          }
        } else {
          hireDate = new Date();
          console.log(`No hire date provided for ${item.employee_id}, using current date`);
        }

        const fte = Number(item.fte);
        if (isNaN(fte) || fte <= 0 || fte > 1) {
          throw new Error('Invalid FTE (must be between 0 and 1)');
        }

        const baseSalary = Number(item.base_salary);
        if (isNaN(baseSalary) || baseSalary <= 0) {
          throw new Error('Invalid base salary');
        }

        const clinicalFte = Number(item.clinical_fte || '0');
        const nonClinicalFte = Number(item.non_clinical_fte || '0');
        const clinicalSalary = Number(item.clinical_salary || '0');
        const nonClinicalSalary = Number(item.non_clinical_salary || '0');

        // Calculate years of experience
        const today = new Date();
        const yearsOfExperience = Number(((today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2));

        return {
          employeeId: item.employee_id,
          firstName: item.first_name,
          lastName: item.last_name,
          email: item.email || `${item.first_name.toLowerCase()}.${item.last_name.toLowerCase()}@healthsystem.org`,
          specialty: item.specialty,
          department: item.department,
          hireDate: hireDate,
          yearsOfExperience: yearsOfExperience,
          fte: fte,
          baseSalary: baseSalary,
          compensationModel: item.compensation_model || 'Standard',
          clinicalFte: clinicalFte,
          nonClinicalFte: nonClinicalFte,
          clinicalSalary: clinicalSalary,
          nonClinicalSalary: nonClinicalSalary,
          status: 'Active',
          terminationDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`);
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
                clinicalFte: provider.clinicalFte,
                nonClinicalFte: provider.nonClinicalFte,
                clinicalSalary: provider.clinicalSalary,
                nonClinicalSalary: provider.nonClinicalSalary,
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
      return NextResponse.json(
        { 
          error: 'Database Error',
          message: dbError instanceof Error ? dbError.message : 'Failed to save providers to database'
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