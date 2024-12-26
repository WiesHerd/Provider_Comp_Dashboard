import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    let data;
    try {
      const body = await request.json();
      console.log('Received request body:', body);
      data = body.data;
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body: Could not parse JSON' },
        { status: 400 }
      );
    }

    console.log('Received wRVU data:', {
      firstRecord: data?.[0],
      totalRecords: data?.length
    });

    // Validate the data array
    if (!Array.isArray(data) || data.length === 0) {
      console.error('Invalid data format:', data);
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of wRVU data.' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure all operations succeed or none do
    const result = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const processedRecords: any[] = [];

      // Process each record
      for (const record of data) {
        console.log('Processing record:', record);
        
        // Validate required fields
        if (!record.employee_id) {
          throw new Error(`Missing employee_id in record`);
        }
        if (!record.specialty) {
          throw new Error(`Missing specialty for employee ${record.employee_id}`);
        }

        // Find or create provider
        let provider = await tx.provider.findUnique({
          where: { employeeId: record.employee_id }
        });

        console.log('Found provider:', provider);

        if (!provider) {
          provider = await tx.provider.create({
            data: {
              employeeId: record.employee_id,
              firstName: record.first_name,
              lastName: record.last_name,
              specialty: record.specialty,
              email: `${record.first_name}.${record.last_name}@example.com`,
              department: record.specialty,
              hireDate: new Date(),
              fte: 1.0,
              baseSalary: 0,
              compensationModel: 'wRVU',
            }
          });
          console.log('Created new provider:', provider);
        }

        // Validate and convert monthly values
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthlyValues: Record<string, number> = {};
        for (const month of months) {
          const value = Number(record[month]);
          if (isNaN(value)) {
            throw new Error(`Invalid ${month} value for employee ${record.employee_id}`);
          }
          monthlyValues[month] = value;
        }

        console.log('Monthly values:', monthlyValues);

        // Delete existing wRVU data for this provider and year
        await tx.wRVUData.deleteMany({
          where: {
            providerId: provider.id,
            year
          }
        });

        // Create new wRVU record
        const wrvuRecord = await tx.wRVUData.create({
          data: {
            providerId: provider.id,
            year,
            ...monthlyValues
          }
        });

        console.log('Created wRVU record:', wrvuRecord);
        processedRecords.push(wrvuRecord);
      }

      return processedRecords;
    });

    console.log('Upload result:', result);

    return NextResponse.json({
      message: `Successfully uploaded ${result.length} wRVU records`,
      count: result.length
    });
  } catch (error) {
    console.error('Error uploading wRVU data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload wRVU data' },
      { status: 500 }
    );
  }
} 