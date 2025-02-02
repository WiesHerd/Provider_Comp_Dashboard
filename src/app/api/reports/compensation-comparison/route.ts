import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider1Id = searchParams.get('provider1');
    const provider2Id = searchParams.get('provider2');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    console.log('Request params:', { provider1Id, provider2Id, year, month });

    if (!provider1Id || !provider2Id) {
      return NextResponse.json(
        { error: 'Both provider IDs are required' },
        { status: 400 }
      );
    }

    // Fetch providers with their related data
    const [provider1Data, provider2Data] = await Promise.all([
      prisma.provider.findUnique({
        where: { id: provider1Id },
        include: {
          metrics: {
            where: {
              year,
              month: {
                lte: month
              }
            }
          },
          wrvuData: {
            where: {
              year,
              month: {
                lte: month
              }
            },
            orderBy: {
              month: 'asc'
            }
          },
          AdditionalPay: {
            where: {
              year,
              month: {
                lte: month
              }
            }
          },
          targetAdjustments: {
            where: {
              year,
              month: {
                lte: month
              }
            }
          },
          wrvuAdjustments: {
            where: {
              year,
              month: {
                lte: month
              }
            }
          }
        }
      }),
      prisma.provider.findUnique({
        where: { id: provider2Id },
        include: {
          metrics: {
            where: {
              year,
              month: {
                lte: month
              }
            }
          },
          wrvuData: {
            where: {
              year,
              month: {
                lte: month
              }
            },
            orderBy: {
              month: 'asc'
            }
          },
          AdditionalPay: {
            where: {
              year,
              month: {
                lte: month
              }
            }
          },
          targetAdjustments: {
            where: {
              year,
              month: {
                lte: month
              }
            }
          },
          wrvuAdjustments: {
            where: {
              year,
              month: {
                lte: month
              }
            }
          }
        }
      })
    ]);

    console.log('Raw provider data:', {
      provider1: provider1Data ? {
        id: provider1Data.id,
        name: `${provider1Data.firstName} ${provider1Data.lastName}`,
        specialty: provider1Data.specialty,
        department: provider1Data.department,
        compensationModel: provider1Data.compensationModel,
        metrics: provider1Data.metrics?.length,
        wrvuData: provider1Data.wrvuData?.length,
        additionalPay: provider1Data.AdditionalPay?.length,
      } : null,
      provider2: provider2Data ? {
        id: provider2Data.id,
        name: `${provider2Data.firstName} ${provider2Data.lastName}`,
        specialty: provider2Data.specialty,
        department: provider2Data.department,
        compensationModel: provider2Data.compensationModel,
        metrics: provider2Data.metrics?.length,
        wrvuData: provider2Data.wrvuData?.length,
        additionalPay: provider2Data.AdditionalPay?.length,
      } : null
    });

    if (!provider1Data || !provider2Data) {
      console.error('Provider(s) not found:', { provider1Id, provider2Id });
      return NextResponse.json(
        { error: 'One or both providers not found' },
        { status: 404 }
      );
    }

    // Log raw provider data
    console.log('Raw Provider 1 Data:', {
      id: provider1Data.id,
      firstName: provider1Data.firstName,
      lastName: provider1Data.lastName,
      specialty: provider1Data.specialty,
      department: provider1Data.department,
      compensationModel: provider1Data.compensationModel,
      rawData: provider1Data
    });

    console.log('Raw Provider 2 Data:', {
      id: provider2Data.id,
      firstName: provider2Data.firstName,
      lastName: provider2Data.lastName,
      specialty: provider2Data.specialty,
      department: provider2Data.department,
      compensationModel: provider2Data.compensationModel,
      rawData: provider2Data
    });

    // Get market data for both providers
    const [provider1Market, provider2Market] = await Promise.all([
      prisma.marketData.findFirst({
        where: { specialty: provider1Data.specialty }
      }),
      prisma.marketData.findFirst({
        where: { specialty: provider2Data.specialty }
      })
    ]);

    // Calculate metrics for each provider
    const calculateProviderMetrics = (provider: any, marketData: any) => {
      console.log('Provider data:', {
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        specialty: provider.specialty,
        wrvuDataCount: provider.wrvuData?.length,
        adjustmentsCount: provider.wrvuAdjustments?.length,
        additionalPayCount: provider.AdditionalPay?.length,
        baseSalary: provider.baseSalary,
        clinicalFte: provider.clinicalFte,
        marketCF: marketData?.p50_cf
      });

      // Calculate YTD WRVUs from wrvuData
      const ytdWRVUs = provider.wrvuData.reduce((total: number, data: any) => total + (data.value || 0), 0);
      const ytdWRVUAdjustments = provider.wrvuAdjustments.reduce((total: number, adj: any) => total + (adj.value || 0), 0);
      const totalYTDWRVUs = ytdWRVUs + ytdWRVUAdjustments;

      console.log('WRVU calculations:', {
        ytdWRVUs,
        ytdWRVUAdjustments,
        totalYTDWRVUs,
        wrvuData: provider.wrvuData.map((d: any) => ({ month: d.month, value: d.value }))
      });

      // Calculate monthly WRVUs (current month only)
      const currentMonthWRVUs = provider.wrvuData
        .filter((data: any) => data.month === month)
        .reduce((total: number, data: any) => total + (data.value || 0), 0);
      
      const currentMonthAdjustments = provider.wrvuAdjustments
        .filter((adj: any) => adj.month === month)
        .reduce((total: number, adj: any) => total + (adj.value || 0), 0);

      console.log('Monthly WRVU calculations:', {
        month,
        currentMonthWRVUs,
        currentMonthAdjustments,
        total: currentMonthWRVUs + currentMonthAdjustments
      });

      // Calculate monthly target using base salary and conversion factor
      const monthlyTarget = (provider.baseSalary / (marketData?.p50_cf || 55)) * (provider.clinicalFte || 1.0);
      const ytdTarget = monthlyTarget * month;
      const ytdTargetAdjustments = provider.targetAdjustments.reduce((total: number, adj: any) => total + (adj.value || 0), 0);
      const totalYTDTarget = ytdTarget + ytdTargetAdjustments;

      console.log('Target calculations:', {
        monthlyTarget,
        ytdTarget,
        ytdTargetAdjustments,
        totalYTDTarget
      });

      // Calculate YTD Compensation
      const ytdAdditionalPay = provider.AdditionalPay.reduce((total: number, pay: any) => total + (pay.amount || 0), 0);
      const baseYTDComp = (provider.baseSalary || 0) * (month / 12);
      
      // Calculate YTD incentives from metrics
      const ytdIncentives = provider.metrics.reduce((total: number, metric: any) => {
        // Get incentive amount minus holdback
        const incentiveAmount = metric.incentivesEarned || 0;
        const holdbackAmount = metric.holdbackAmount || 0;
        return total + (incentiveAmount - holdbackAmount);
      }, 0);

      const totalYTDComp = baseYTDComp + ytdAdditionalPay + ytdIncentives;

      console.log('Compensation calculations:', {
        ytdAdditionalPay,
        baseYTDComp,
        ytdIncentives,
        totalYTDComp
      });

      // Calculate WRVU Percentile
      const annualizedWRVUs = (totalYTDWRVUs / month) * 12;
      const wrvuPercentile = calculatePercentile(annualizedWRVUs, [
        { percentile: 25, value: marketData?.p25_wrvu || 0 },
        { percentile: 50, value: marketData?.p50_wrvu || 0 },
        { percentile: 75, value: marketData?.p75_wrvu || 0 },
        { percentile: 90, value: marketData?.p90_wrvu || 0 }
      ]);

      // Calculate Compensation Percentile
      const annualizedComp = (totalYTDComp / month) * 12;
      const compPercentile = calculatePercentile(annualizedComp, [
        { percentile: 25, value: marketData?.p25_total || 0 },
        { percentile: 50, value: marketData?.p50_total || 0 },
        { percentile: 75, value: marketData?.p75_total || 0 },
        { percentile: 90, value: marketData?.p90_total || 0 }
      ]);

      return {
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        specialty: provider.specialty || '-',
        department: provider.department || '-',
        compensationModel: provider.compensationModel || '-',
        yearsOfExperience: provider.yearsOfExperience || 0,
        fte: Number(provider.fte || 1.0).toFixed(2),
        clinicalFte: Number(provider.clinicalFte || 1.0).toFixed(2),
        nonClinicalFte: Number(provider.nonClinicalFte || 0).toFixed(2),
        baseSalary: Number(provider.baseSalary || 0),
        clinicalSalary: Number(provider.clinicalSalary || provider.baseSalary || 0),
        nonClinicalSalary: Number(provider.nonClinicalSalary || 0),
        metrics: {
          baseSalary: Number(provider.baseSalary || 0),
          monthlyBaseSalary: Number(provider.baseSalary ? provider.baseSalary / 12 : 0),
          monthlyWRVUs: Number(currentMonthWRVUs + currentMonthAdjustments),
          monthlyTargetWRVUs: Number(monthlyTarget),
          ytdBase: Number(baseYTDComp),
          ytdIncentives: Number(ytdIncentives),
          ytdAdditionalPay: Number(ytdAdditionalPay),
          totalYTDCompensation: Number(totalYTDComp),
          ytdWRVUs: Number(totalYTDWRVUs),
          ytdTargetWRVUs: Number(totalYTDTarget),
          planProgress: Number(totalYTDTarget > 0 ? (totalYTDWRVUs / totalYTDTarget) * 100 : 0),
          wrvuPercentile: Number(wrvuPercentile),
          compPercentile: Number(compPercentile),
          compPerWRVU: Number(totalYTDWRVUs > 0 ? totalYTDComp / totalYTDWRVUs : 0),
          productivityCompGap: Number(wrvuPercentile - compPercentile)
        }
      };
    };

    const provider1Metrics = calculateProviderMetrics(provider1Data, provider1Market);
    const provider2Metrics = calculateProviderMetrics(provider2Data, provider2Market);

    // Prepare chart data
    const chartData = [
      {
        metric: 'Base Salary',
        provider1: provider1Metrics.metrics.baseSalary,
        provider2: provider2Metrics.metrics.baseSalary,
      },
      {
        metric: 'YTD Compensation',
        provider1: provider1Metrics.metrics.totalYTDCompensation,
        provider2: provider2Metrics.metrics.totalYTDCompensation,
      },
      {
        metric: 'YTD WRVUs',
        provider1: provider1Metrics.metrics.ytdWRVUs,
        provider2: provider2Metrics.metrics.ytdWRVUs,
      },
      {
        metric: 'Plan Progress',
        provider1: provider1Metrics.metrics.planProgress,
        provider2: provider2Metrics.metrics.planProgress,
      },
      {
        metric: 'WRVU Percentile',
        provider1: provider1Metrics.metrics.wrvuPercentile,
        provider2: provider2Metrics.metrics.wrvuPercentile,
      },
      {
        metric: 'Comp Percentile',
        provider1: provider1Metrics.metrics.compPercentile,
        provider2: provider2Metrics.metrics.compPercentile,
      },
    ];

    return NextResponse.json({
      provider1: provider1Metrics,
      provider2: provider2Metrics,
      chartData
    });
  } catch (error) {
    console.error('Error in compensation comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}

// Helper function to calculate percentile based on benchmarks
function calculatePercentile(value: number, benchmarks: Array<{ percentile: number; value: number }>) {
  if (!value || value <= 0) return 0;

  // If below lowest benchmark
  if (value < benchmarks[0].value) {
    return (value / benchmarks[0].value) * benchmarks[0].percentile;
  }

  // If above highest benchmark
  if (value > benchmarks[benchmarks.length - 1].value) {
    const lastBenchmark = benchmarks[benchmarks.length - 1];
    const secondLastBenchmark = benchmarks[benchmarks.length - 2];
    const extraPercentile = ((value - lastBenchmark.value) / (lastBenchmark.value - secondLastBenchmark.value)) * 
      (lastBenchmark.percentile - secondLastBenchmark.percentile);
    return Math.min(100, lastBenchmark.percentile + extraPercentile);
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (value >= lower.value && value <= upper.value) {
      const range = upper.value - lower.value;
      const position = value - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      return lower.percentile + (position / range) * percentileRange;
    }
  }

  return 0;
} 

