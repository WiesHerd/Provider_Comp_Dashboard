import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('Successfully connected to the database');
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const specialty = searchParams.get('specialty');

    console.log('Starting provider fetch...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`Fetching data for period: ${period}, Month: ${currentMonth}, Year: ${currentYear}`);

    // Build the where clause
    const where: any = {};
    if (specialty && specialty !== 'All Departments') {
      where.specialty = specialty;
    }

    // Get all providers with their metrics and analytics
    const providers = await prisma.provider.findMany({
      where,
      include: {
        metrics: {
          where: {
            year: currentYear,
            month: currentMonth
          }
        },
        analytics: {
          where: {
            year: currentYear,
            month: currentMonth
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });

    console.log(`Found ${providers.length} providers`);

    // Transform the data and add MoM trend
    const providersWithMetrics = await Promise.all(
      providers.map(async (provider) => {
        // Get previous month metrics for MoM trend
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const prevMetrics = await prisma.providerMetrics.findFirst({
          where: {
            providerId: provider.id,
            year: prevYear,
            month: prevMonth
          }
        });

        const metrics = provider.metrics[0] || {
          actualWRVUs: 0,
          rawMonthlyWRVUs: 0,
          ytdWRVUs: 0,
          targetWRVUs: 0,
          baseSalary: 0,
          totalCompensation: 0,
          incentivesEarned: 0,
          holdbackAmount: 0,
          wrvuPercentile: 0,
          compPercentile: 0,
          planProgress: 0
        };
        const analytics = provider.analytics[0] || {
          ytdProgress: 0
        };

        // Calculate MoM trend
        const momTrend = prevMetrics?.actualWRVUs 
          ? ((metrics.actualWRVUs || 0) - prevMetrics.actualWRVUs) / prevMetrics.actualWRVUs * 100
          : 0;

        return {
          id: provider.id,
          employeeId: provider.employeeId,
          firstName: provider.firstName,
          lastName: provider.lastName,
          email: provider.email,
          specialty: provider.specialty,
          department: provider.department,
          status: provider.status,
          terminationDate: provider.terminationDate,
          hireDate: provider.hireDate,
          fte: provider.fte,
          clinicalFte: provider.clinicalFte,
          nonClinicalFte: provider.nonClinicalFte,
          baseSalary: provider.baseSalary,
          clinicalSalary: provider.clinicalSalary,
          nonClinicalSalary: provider.nonClinicalSalary,
          compensationModel: provider.compensationModel,
          createdAt: provider.createdAt,
          updatedAt: provider.updatedAt,
          // Metrics data
          actualWRVUs: metrics.actualWRVUs,
          rawMonthlyWRVUs: metrics.rawMonthlyWRVUs,
          ytdWRVUs: metrics.ytdWRVUs,
          targetWRVUs: metrics.targetWRVUs,
          totalCompensation: metrics.totalCompensation,
          incentivesEarned: metrics.incentivesEarned,
          holdbackAmount: metrics.holdbackAmount,
          wrvuPercentile: metrics.wrvuPercentile,
          compPercentile: metrics.compPercentile,
          planProgress: metrics.planProgress,
          ytdProgress: analytics.ytdProgress,
          momTrend
        };
      })
    );

    console.log(`Returning formatted providers: ${providersWithMetrics.length}`);
    return NextResponse.json(providersWithMetrics);
  } catch (error) {
    console.error('Error in providers route:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
} 