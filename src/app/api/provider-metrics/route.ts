import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { monthToNumber } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Convert string month to number if needed
    const month = typeof data.month === 'string' ? monthToNumber[data.month.toLowerCase()] : data.month;
    
    if (!month) {
      throw new Error('Invalid month provided');
    }

    // Calculate cumulative values
    const cumulativeWRVUs = Number(data.ytdWRVUs) || 0;
    const monthlyTarget = Number(data.targetWRVUs) || 0;
    const cumulativeTarget = monthlyTarget * month;

    // Ensure all numeric fields are properly typed
    const metrics = await prisma.providerMetrics.upsert({
      where: {
        providerId_year_month: {
          providerId: data.providerId,
          year: data.year,
          month: month
        }
      },
      update: {
        actualWRVUs: Number(data.actualWRVUs) || 0,
        rawMonthlyWRVUs: Number(data.rawMonthlyWRVUs) || 0,
        cumulativeWRVUs,
        targetWRVUs: monthlyTarget,
        cumulativeTarget,
        baseSalary: Number(data.baseSalary) || 0,
        totalCompensation: Number(data.totalCompensation) || 0,
        wrvuPercentile: Number(data.wrvuPercentile) || 0,
        compPercentile: Number(data.compPercentile) || 0,
        incentivesEarned: Number(data.incentivesEarned) || 0,
        holdbackAmount: Number(data.holdbackAmount) || 0,
        planProgress: Number(data.planProgress) || 0,
        monthsCompleted: month
      },
      create: {
        providerId: data.providerId,
        year: data.year,
        month: month,
        actualWRVUs: Number(data.actualWRVUs) || 0,
        rawMonthlyWRVUs: Number(data.rawMonthlyWRVUs) || 0,
        cumulativeWRVUs,
        targetWRVUs: monthlyTarget,
        cumulativeTarget,
        baseSalary: Number(data.baseSalary) || 0,
        totalCompensation: Number(data.totalCompensation) || 0,
        wrvuPercentile: Number(data.wrvuPercentile) || 0,
        compPercentile: Number(data.compPercentile) || 0,
        incentivesEarned: Number(data.incentivesEarned) || 0,
        holdbackAmount: Number(data.holdbackAmount) || 0,
        planProgress: Number(data.planProgress) || 0,
        monthsCompleted: month
      }
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error storing provider metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store provider metrics' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;

    const metrics = await prisma.providerMetrics.findMany({
      where: {
        year,
        month
      },
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
            clinicalFte: true,
            baseSalary: true
          }
        }
      }
    });

    const formattedMetrics = metrics.map(metric => ({
      id: metric.id,
      providerId: metric.providerId,
      providerName: `${metric.provider.firstName} ${metric.provider.lastName}`,
      specialty: metric.provider.specialty,
      actualWRVUs: metric.actualWRVUs,
      targetWRVUs: metric.targetWRVUs,
      wrvuPercentile: metric.wrvuPercentile,
      baseSalary: metric.baseSalary,
      incentivePay: metric.incentivesEarned,
      totalCompensation: metric.totalCompensation,
      compPercentile: metric.compPercentile,
      clinicalFte: metric.provider.clinicalFte
    }));

    return NextResponse.json(formattedMetrics);
  } catch (error) {
    console.error('Error fetching provider metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider metrics' },
      { status: 500 }
    );
  }
} 