import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get all providers with their target adjustments and metrics
    const providers = await prisma.provider.findMany({
      include: {
        targetAdjustments: {
          where: {
            year: currentYear
          }
        },
        metrics: {
          where: {
            year: currentYear
          }
        }
      }
    });

    const results = await Promise.all(providers.map(async (provider) => {
      try {
        // Calculate base monthly target (annual target / 12)
        const baseMonthlyTarget = (provider.targetWRVUs || 0) / 12;

        // Process each month
        const monthUpdates = await Promise.all(Array.from({length: 12}, (_, i) => i + 1).map(async (month) => {
          // Get target adjustments for this month
          const monthlyAdjustments = provider.targetAdjustments
            .filter(adj => adj.month === month)
            .reduce((sum, adj) => sum + adj.value, 0);

          // Calculate total target for this month
          const monthlyTarget = baseMonthlyTarget + monthlyAdjustments;

          // Calculate cumulative target up to this month
          const cumulativeTarget = (baseMonthlyTarget * month) + 
            provider.targetAdjustments
              .filter(adj => adj.month <= month)
              .reduce((sum, adj) => sum + adj.value, 0);

          // Upsert metrics for this month
          return prisma.providerMetrics.upsert({
            where: {
              providerId_year_month: {
                providerId: provider.id,
                year: currentYear,
                month: month
              }
            },
            create: {
              providerId: provider.id,
              year: currentYear,
              month: month,
              targetWRVUs: monthlyTarget,
              cumulativeTarget: cumulativeTarget,
              // Set default values for required fields
              actualWRVUs: 0,
              rawMonthlyWRVUs: 0,
              cumulativeWRVUs: 0,
              baseSalary: provider.baseSalary || 0,
              totalCompensation: 0,
              incentivesEarned: 0,
              holdbackAmount: 0,
              wrvuPercentile: 0,
              compPercentile: 0,
              planProgress: 0,
              monthsCompleted: 0
            },
            update: {
              targetWRVUs: monthlyTarget,
              cumulativeTarget: cumulativeTarget
            }
          });
        }));

        return {
          providerId: provider.id,
          name: `${provider.firstName} ${provider.lastName}`,
          updatedMonths: monthUpdates.length
        };
      } catch (error) {
        console.error(`Error processing provider ${provider.id}:`, error);
        return {
          providerId: provider.id,
          name: `${provider.firstName} ${provider.lastName}`,
          error: error.message
        };
      }
    }));

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in populate-targets:', error);
    return NextResponse.json(
      { error: 'Failed to populate target wRVUs' },
      { status: 500 }
    );
  }
} 