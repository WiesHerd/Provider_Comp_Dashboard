import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Add CORS headers
    const headersList = headers();
    const origin = '*';  // For development, allow all origins

    // Required filters
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    
    console.log('API Route - Fetching data for:', { year, month });

    // Get providers with their wRVU data
    const providers = await prisma.provider.findMany({
      where: {
        status: 'Active'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        specialty: true,
        department: true,
        clinicalFte: true,
        wrvuData: {
          where: {
            year,
            month: {
              lte: month // Get all months up to and including the selected month
            }
          }
        }
      }
    });

    console.log('API Route - Found providers:', providers.length);
    // Log sample wRVU data for debugging
    if (providers.length > 0) {
      console.log('Sample wRVU data for first provider:', providers[0].wrvuData);
    }

    const formattedData = providers.map(provider => {
      // Find the exact month's data
      const monthlyWRVUs = provider.wrvuData.find(d => d.month === month)?.value || 0;
      // Sum all months up to and including selected month
      const ytdWRVUs = provider.wrvuData.reduce((sum, data) => sum + (data.value || 0), 0);

      return {
        id: provider.id,
        employeeId: provider.employeeId,
        name: `${provider.firstName} ${provider.lastName}`,
        specialty: provider.specialty,
        department: provider.department,
        clinicalFte: provider.clinicalFte,
        monthlyWRVUs: Number(monthlyWRVUs),
        ytdWRVUs: Number(ytdWRVUs),
        planProgress: 0,
        wrvuPercentile: 0,
        baseSalary: 0,
        totalCompensation: 0,
        compPercentile: 0
      };
    });

    const response = NextResponse.json({
      data: formattedData,
      summary: {
        totalProviders: providers.length,
        averageWRVUPercentile: 0,
        averagePlanProgress: 0,
        totalWRVUs: formattedData.reduce((sum, p) => sum + p.monthlyWRVUs, 0),
        totalCompensation: 0
      },
      pagination: {
        currentPage: 1,
        pageSize: 50,
        totalCount: providers.length,
        totalPages: Math.ceil(providers.length / 50)
      }
    });

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('API Route - Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate monthly performance report' },
      { status: 500 }
    );
  }
} 