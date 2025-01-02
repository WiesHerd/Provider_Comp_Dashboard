import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const counts = {
      providers: await prisma.provider.count({ where: { status: 'Active' } }),
      metrics: await prisma.providerMetrics.count({
        where: {
          year: currentYear,
          month: currentMonth
        }
      }),
      analytics: await prisma.providerAnalytics.count({
        where: {
          year: currentYear,
          month: currentMonth
        }
      }),
      wrvuData: await prisma.wRVUData.count({
        where: {
          year: currentYear,
          month: currentMonth
        }
      }),
      wrvuAdjustments: await prisma.wRVUAdjustment.count({
        where: {
          year: currentYear,
          month: currentMonth
        }
      }),
      targetAdjustments: await prisma.targetAdjustment.count({
        where: {
          year: currentYear,
          month: currentMonth
        }
      })
    };

    // Get a sample of actual data
    const sampleData = {
      providers: await prisma.provider.findMany({
        take: 2,
        where: { status: 'Active' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true
        }
      }),
      metrics: await prisma.providerMetrics.findMany({
        take: 2,
        where: {
          year: currentYear,
          month: currentMonth
        },
        include: {
          provider: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    };

    return NextResponse.json({
      currentPeriod: { year: currentYear, month: currentMonth },
      counts,
      sampleData
    });
  } catch (error) {
    console.error('Debug query error:', error);
    return NextResponse.json(
      { error: 'Failed to query debug data' },
      { status: 500 }
    );
  }
} 