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
    const year = parseInt(searchParams.get('year') || '2024'); // Default to 2024
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    
    console.log('API Route - Fetching data for:', { year, month });

    // Get providers with their metrics data
    const providers = await prisma.provider.findMany({
      where: {
        status: 'Active'
      },
      include: {
        metrics: {
          where: {
            year: year, // Use the year from query params
            month: month // Use the requested month
          }
        }
      }
    });

    console.log('API Route - Found providers:', providers.length);
    
    // Detailed logging
    if (providers.length > 0) {
      const firstProvider = providers[0];
      console.log('First provider details:', {
        id: firstProvider.id,
        name: `${firstProvider.firstName} ${firstProvider.lastName}`,
        metrics: firstProvider.metrics
      });
    }

    const formattedData = providers.map(provider => {
      const currentMetrics = provider.metrics[0] || null;
      
      return {
        id: provider.id,
        employeeId: provider.employeeId,
        name: `${provider.firstName} ${provider.lastName}`,
        specialty: provider.specialty,
        department: provider.department,
        clinicalFte: provider.clinicalFte,
        monthlyWRVUs: currentMetrics?.actualWRVUs || 0,
        targetWRVUs: currentMetrics?.targetWRVUs || 0,
        ytdWRVUs: currentMetrics?.cumulativeWRVUs || 0,
        ytdTargetWRVUs: currentMetrics?.cumulativeTarget || 0,
        planProgress: currentMetrics?.planProgress || 0,
        wrvuPercentile: currentMetrics?.wrvuPercentile || 0,
        baseSalary: currentMetrics?.baseSalary || 0,
        totalCompensation: currentMetrics?.totalCompensation || 0,
        compPercentile: currentMetrics?.compPercentile || 0
      };
    });

    const response = NextResponse.json({
      data: formattedData,
      summary: {
        totalProviders: providers.length,
        averageWRVUPercentile: formattedData.reduce((sum, p) => sum + p.wrvuPercentile, 0) / providers.length,
        averagePlanProgress: formattedData.reduce((sum, p) => sum + p.planProgress, 0) / providers.length,
        totalWRVUs: formattedData.reduce((sum, p) => sum + p.monthlyWRVUs, 0),
        totalCompensation: formattedData.reduce((sum, p) => sum + p.totalCompensation, 0)
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