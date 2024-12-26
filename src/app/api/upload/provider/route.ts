import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    // First try to parse the request body
    let data;
    try {
      const body = await request.json();
      data = body.data;
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body: Could not parse JSON' },
        { status: 400 }
      );
    }

    console.log('Received provider data:', {
      firstRecord: data?.[0],
      totalRecords: data?.length
    });

    // Validate the data array
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of providers.' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No provider data found in request.' },
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
          email: item.email,
          specialty: item.specialty,
          department: item.department,
          hireDate: hireDate,
          fte: fte,
          baseSalary: salary,
          compensationModel: item.compensation_model,
          status: 'Active',
          terminationDate: null
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

    // Create the providers in the database
    const result = await prisma.provider.createMany({
      data: providers
    });

    console.log('Upload result:', result);

    return NextResponse.json({
      message: `Successfully uploaded ${result.count} providers`,
      count: result.count,
      preview: providers.slice(0, 5)
    });
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