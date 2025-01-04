import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Fetching providers...');
    const providers = await prisma.provider.findMany({
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Log the data for verification
    if (providers.length > 0) {
      console.log('Sample provider data:', {
        id: providers[0].id,
        employeeId: providers[0].employeeId,
        name: `${providers[0].firstName} ${providers[0].lastName}`,
        specialty: providers[0].specialty,
        compensationModel: providers[0].compensationModel,
        hireDate: providers[0].hireDate,
        formattedHireDate: providers[0].hireDate ? new Date(providers[0].hireDate).toLocaleDateString() : 'N/A',
        baseSalary: providers[0].baseSalary,
        clinicalSalary: providers[0].clinicalSalary,
        nonClinicalSalary: providers[0].nonClinicalSalary
      });
    }

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received provider data:', data);

    // Handle both single provider and array of providers
    const providers = Array.isArray(data) ? data : [data];
    console.log(`Processing ${providers.length} providers`);

    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          // Convert string values to numbers where needed
          const clinicalSalary = Number(provider.clinicalSalary) || Number(provider.baseSalary) || 0;
          const nonClinicalSalary = Number(provider.nonClinicalSalary) || 0;
          const baseSalary = clinicalSalary + nonClinicalSalary;

          // Parse hire date properly
          let hireDate = provider.hireDate ? new Date(provider.hireDate) : null;
          if (!hireDate || isNaN(hireDate.getTime())) {
            console.warn(`Invalid hire date for ${provider.employeeId}: ${provider.hireDate}`);
            hireDate = null;
          }

          const processedProvider = {
            employeeId: provider.employeeId?.toString() || '',
            firstName: provider.firstName || '',
            lastName: provider.lastName || '',
            email: provider.email || `${provider.firstName?.toLowerCase()}.${provider.lastName?.toLowerCase()}@example.com`,
            specialty: provider.specialty || '',
            department: provider.department || provider.specialty || '',
            status: provider.status || 'Active',
            hireDate: hireDate,
            fte: Number(provider.fte) || 1.0,
            clinicalFte: Number(provider.clinicalFte) || Number(provider.fte) || 1.0,
            nonClinicalFte: Number(provider.nonClinicalFte) || 0,
            baseSalary: baseSalary,
            clinicalSalary: clinicalSalary,
            nonClinicalSalary: nonClinicalSalary,
            compensationModel: provider.compensationModel || '',
            targetWRVUs: Number(provider.targetWRVUs) || 0
          };

          // Log the processed data for verification
          console.log('Processing provider:', {
            employeeId: provider.employeeId,
            name: `${provider.firstName} ${provider.lastName}`,
            originalHireDate: provider.hireDate,
            processedHireDate: processedProvider.hireDate?.toISOString() || 'null',
            compensationModel: processedProvider.compensationModel
          });

          // Upsert the provider (create if not exists, update if exists)
          const result = await prisma.provider.upsert({
            where: {
              employeeId: processedProvider.employeeId
            },
            update: processedProvider,
            create: processedProvider
          });

          console.log(`Successfully processed provider: ${result.employeeId}`);
          return result;
        } catch (error) {
          console.error(`Error processing provider:`, error);
          return null;
        }
      })
    );

    const successfulUploads = results.filter(r => r !== null);
    console.log(`Successfully processed ${successfulUploads.length} out of ${providers.length} providers`);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successfulUploads.length} providers`,
      providers: successfulUploads
    });
  } catch (error) {
    console.error('Error processing providers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process providers', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 