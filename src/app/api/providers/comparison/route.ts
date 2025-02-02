import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');

    console.log('Fetching providers for specialty:', specialty);

    // First, let's log all providers to see what we have
    const allProviders = await prisma.provider.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialty: true,
        department: true,
        status: true,
        yearsOfExperience: true,
        fte: true,
        clinicalFte: true,
        nonClinicalFte: true,
        baseSalary: true,
        clinicalSalary: true,
        nonClinicalSalary: true,
        compensationModel: true,
        targetWRVUs: true
      }
    });
    console.log('All providers in database:', allProviders);

    // Get providers for the selected specialty
    const providers = await prisma.provider.findMany({
      where: specialty ? {
        specialty: specialty,
        status: 'Active'  // Only get active providers
      } : undefined,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        specialty: true,
        department: true,
        status: true,
        yearsOfExperience: true,
        fte: true,
        clinicalFte: true,
        nonClinicalFte: true,
        baseSalary: true,
        clinicalSalary: true,
        nonClinicalSalary: true,
        compensationModel: true,
        targetWRVUs: true,
        metrics: {
          where: {
            year: new Date().getFullYear(),
            month: {
              lte: new Date().getMonth() + 1
            }
          },
          orderBy: {
            month: 'desc'
          }
        },
        settings: true,
        additionalPayments: {
          where: {
            year: new Date().getFullYear(),
            month: {
              lte: new Date().getMonth() + 1
            }
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Debug log to see what data we're getting
    console.log('Raw provider data:', JSON.stringify(providers, null, 2));

    const enrichedProviders = providers.map(provider => {
      // Calculate YTD metrics
      const ytdMetrics = provider.metrics || [];
      const ytdAdditionalPay = provider.additionalPayments || [];
      
      const monthlyBasePay = provider.baseSalary / 12;
      const ytdBasePay = monthlyBasePay * (new Date().getMonth() + 1);
      
      const totalAdditionalPay = ytdAdditionalPay.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        id: provider.id,
        employeeId: provider.employeeId,
        name: `${provider.firstName} ${provider.lastName}`,
        email: provider.email,
        specialty: provider.specialty,  // Use exact value from database
        department: provider.department,  // Use exact value from database
        status: provider.status,
        compensationModel: provider.compensationModel,
        yearsOfExperience: provider.yearsOfExperience || 0,
        fte: provider.fte || 1.0,
        clinicalFte: provider.clinicalFte || 1.0,
        nonClinicalFte: provider.nonClinicalFte || 0.0,
        baseSalary: provider.baseSalary || 0,
        clinicalSalary: provider.clinicalSalary || provider.baseSalary || 0,
        nonClinicalSalary: provider.nonClinicalSalary || 0,
        targetWRVUs: provider.targetWRVUs || 0,
        monthlyBasePay: monthlyBasePay,
        ytdBasePay: ytdBasePay,
        ytdAdditionalPay: totalAdditionalPay,
        ytdTotalCompensation: ytdBasePay + totalAdditionalPay,
        metrics: ytdMetrics,
        holdbackPercent: provider.settings?.holdbackPercent || 20
      };
    });

    console.log('Enriched provider data:', JSON.stringify(enrichedProviders, null, 2));

    return NextResponse.json(enrichedProviders);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
} 