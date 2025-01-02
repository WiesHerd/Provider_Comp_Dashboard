import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Fetching providers...');
    const providers = await prisma.provider.findMany({
      orderBy: {
        lastName: 'asc'
      }
    });

    // Update base salaries for providers where it's 0
    await Promise.all(providers.map(async (provider) => {
      if (provider.baseSalary === 0) {
        const totalSalary = provider.clinicalSalary + provider.nonClinicalSalary;
        if (totalSalary > 0) {
          await prisma.provider.update({
            where: { id: provider.id },
            data: { baseSalary: totalSalary }
          });
          provider.baseSalary = totalSalary; // Update the local object as well
        }
      }
    }));

    // Log the data
    if (providers.length > 0) {
      console.log('Sample provider data:', JSON.stringify({
        id: providers[0].id,
        employeeId: providers[0].employeeId,
        name: `${providers[0].firstName} ${providers[0].lastName}`,
        specialty: providers[0].specialty,
        baseSalary: providers[0].baseSalary,
        clinicalSalary: providers[0].clinicalSalary,
        nonClinicalSalary: providers[0].nonClinicalSalary,
        formattedBaseSalary: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(providers[0].baseSalary),
        fte: providers[0].fte,
        clinicalFte: providers[0].clinicalFte,
        nonClinicalFte: providers[0].nonClinicalFte
      }, null, 2));
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

          const processedProvider = {
            employeeId: provider.employeeId?.toString() || '',
            firstName: provider.firstName || '',
            lastName: provider.lastName || '',
            email: provider.email || `${provider.firstName?.toLowerCase()}.${provider.lastName?.toLowerCase()}@example.com`,
            specialty: provider.specialty || '',
            department: provider.department || provider.specialty || '',
            status: provider.status || 'Active',
            hireDate: provider.hireDate ? new Date(provider.hireDate) : new Date(),
            fte: Number(provider.fte) || 1.0,
            clinicalFte: Number(provider.clinicalFte) || Number(provider.fte) || 1.0,
            nonClinicalFte: Number(provider.nonClinicalFte) || 0,
            baseSalary: baseSalary,
            clinicalSalary: clinicalSalary,
            nonClinicalSalary: nonClinicalSalary,
            compensationModel: provider.compensationModel || 'Standard',
            targetWRVUs: Number(provider.targetWRVUs) || 0
          };

          // Log the hire date for debugging
          console.log('Processing provider:', {
            employeeId: provider.employeeId,
            name: `${provider.firstName} ${provider.lastName}`,
            originalHireDate: provider.hireDate,
            processedHireDate: processedProvider.hireDate.toISOString(),
            isDefaultDate: !provider.hireDate
          });

          // Validate hire date and ensure it's not in the future
          if (isNaN(processedProvider.hireDate.getTime()) || processedProvider.hireDate.getFullYear() > new Date().getFullYear()) {
            console.warn(`Invalid or future hire date for ${provider.employeeId}, using current date`);
            processedProvider.hireDate = new Date();
          }

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