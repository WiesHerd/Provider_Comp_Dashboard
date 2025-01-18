import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/providers/employee/[employeeId] - Get a provider by employeeId
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params;
    
    // Get current date info for metrics
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const provider = await prisma.provider.findUnique({
      where: { employeeId },
      include: {
        wrvuData: {
          where: {
            year: currentYear,
            month: {
              lte: currentMonth
            }
          }
        },
        metrics: {
          where: {
            year: currentYear,
            month: currentMonth
          },
          orderBy: {
            month: 'desc'
          },
          take: 1
        },
        additionalPayments: {
          where: {
            year: currentYear,
            month: {
              lte: currentMonth
            }
          }
        },
        wrvuAdjustments: {
          where: {
            year: currentYear
          }
        },
        targetAdjustments: {
          where: {
            year: currentYear
          }
        }
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Calculate YTD wRVUs
    const ytdWRVUs = provider.wrvuData.reduce((sum, data) => sum + (data.value || 0), 0);

    // Get the current metrics
    const currentMetrics = provider.metrics[0];

    // Format response
    const response = {
      ...provider,
      ytdWRVUs,
      currentMetrics: currentMetrics || {
        actualWRVUs: 0,
        targetWRVUs: 0,
        baseSalary: provider.baseSalary || 0,
        totalCompensation: 0,
        wrvuPercentile: 0,
        compPercentile: 0,
        incentivesEarned: 0,
        holdbackAmount: 0,
        planProgress: 0
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    );
  }
}

// DELETE /api/providers/employee/[employeeId] - Delete a provider by employeeId
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params;

    // First find the provider to get their ID
    const provider = await prisma.provider.findUnique({
      where: { employeeId }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Delete all related records in the correct order
    await prisma.$transaction(async (tx) => {
      // Delete provider settings
      await tx.providerSettings.deleteMany({
        where: { providerId: provider.id }
      });

      // Delete provider analytics
      await tx.providerAnalytics.deleteMany({
        where: { providerId: provider.id }
      });

      // Delete WRVU data and history
      const wrvuData = await tx.wRVUData.findMany({
        where: { providerId: provider.id }
      });
      for (const wrvu of wrvuData) {
        await tx.wRVUHistory.deleteMany({
          where: { wrvuDataId: wrvu.id }
        });
      }
      await tx.wRVUData.deleteMany({
        where: { providerId: provider.id }
      });

      // Finally delete the provider
      await tx.provider.delete({
        where: { id: provider.id }
      });
    });

    return NextResponse.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    );
  }
} 