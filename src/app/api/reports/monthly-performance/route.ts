import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Force dynamic behavior and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to write logs
function writeToLog(message: string) {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'terry_moore_calculations.log');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Write to log file
  fs.appendFileSync(logFile, message + '\n');
}

// Helper functions for percentile calculations
function calculateWRVUPercentile(ytdWRVUs: number, monthsCompleted: number, fte: number, marketData: any) {
  if (!marketData || monthsCompleted === 0) return 0;

  // Annualize YTD wRVUs based on months completed
  const annualizedWRVUs = (ytdWRVUs / monthsCompleted) * 12;
  
  // Adjust for FTE if less than 1.0
  const fteAdjustedWRVUs = fte < 1.0 ? annualizedWRVUs / fte : annualizedWRVUs;

  // Compare to market data thresholds and interpolate
  const benchmarks = [
    { percentile: 25, value: marketData.p25_wrvu || 0 },
    { percentile: 50, value: marketData.p50_wrvu || 0 },
    { percentile: 75, value: marketData.p75_wrvu || 0 },
    { percentile: 90, value: marketData.p90_wrvu || 0 }
  ];

  // If below 25th percentile
  if (fteAdjustedWRVUs < benchmarks[0].value) {
    return benchmarks[0].value > 0 ? (fteAdjustedWRVUs / benchmarks[0].value) * 25 : 0;
  }

  // If above 90th percentile
  if (fteAdjustedWRVUs > benchmarks[3].value) {
    const extraPercentile = benchmarks[3].value > 0 
      ? ((fteAdjustedWRVUs - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 0;
    return Math.min(100, 90 + extraPercentile);
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedWRVUs >= lower.value && fteAdjustedWRVUs <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedWRVUs - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      return range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
    }
  }

  return 0;
}

function calculateCompPercentile(annualizedCompensation: number, fte: number, marketData: any) {
  if (!marketData) return 0;

  // Adjust for FTE if less than 1.0
  const fteAdjustedComp = fte < 1.0 ? annualizedCompensation / fte : annualizedCompensation;

  // Compare to market data thresholds and interpolate
  const benchmarks = [
    { percentile: 25, value: marketData.p25_total || 0 },
    { percentile: 50, value: marketData.p50_total || 0 },
    { percentile: 75, value: marketData.p75_total || 0 },
    { percentile: 90, value: marketData.p90_total || 0 }
  ];

  // Log calculation details for Terry Moore
  if (annualizedCompensation === 407821.43) {
    writeToLog('\nCompensation Percentile Calculation:');
    writeToLog(JSON.stringify({
      annualizedComp: annualizedCompensation,
      fte: fte,
      fteAdjustedComp: fteAdjustedComp,
      benchmarks: benchmarks
    }, null, 2));
  }

  // If below 25th percentile
  if (fteAdjustedComp < benchmarks[0].value) {
    const percentile = (fteAdjustedComp / benchmarks[0].value) * 25;
    return percentile;
  }

  // If above 90th percentile
  if (fteAdjustedComp > benchmarks[3].value) {
    const extraPercentile = ((fteAdjustedComp - benchmarks[3].value) / (benchmarks[3].value - benchmarks[2].value)) * 15;
    return Math.min(100, 90 + extraPercentile);
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedComp >= lower.value && fteAdjustedComp <= upper.value) {
      const percentileRange = upper.percentile - lower.percentile;
      const valueRange = upper.value - lower.value;
      const position = fteAdjustedComp - lower.value;
      const percentile = lower.percentile + (position / valueRange) * percentileRange;

      // Log the interpolation details for Terry Moore
      if (annualizedCompensation === 407821.43) {
        writeToLog('\nPercentile Interpolation:');
        writeToLog(JSON.stringify({
          lowerBenchmark: lower,
          upperBenchmark: upper,
          position: position,
          valueRange: valueRange,
          percentileRange: percentileRange,
          calculatedPercentile: percentile
        }, null, 2));
      }

      return percentile;
    }
  }

  return 0;
}

function calculateMonthlyTarget(baseSalary: number, conversionFactor: number, clinicalFte: number) {
  if (!baseSalary || baseSalary <= 0) return 0;
  if (!conversionFactor || conversionFactor <= 0) return 0;
  if (!clinicalFte || clinicalFte <= 0) return 0;

  // Calculate annual target wRVUs
  const annualTarget = (baseSalary / conversionFactor);
  
  // Calculate monthly target adjusted for clinical FTE
  return (annualTarget / 12) * clinicalFte;
}

export async function GET(request: Request) {
  try {
    // Clear previous log file
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'terry_moore_calculations.log');
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }

    // Add CORS headers
    const headersList = headers();
    const origin = '*';

    // Required filters
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2024');
    const month = parseInt(searchParams.get('month') || '1');
    
    console.log('Starting calculations for:', { year, month });

    // Get all active providers with their metrics and market data
    const providers = await prisma.provider.findMany({
      where: { status: 'Active' },
      include: {
        metrics: {
          where: {
            year,
            month: {
              lte: month
            }
          }
        },
        settings: true,
        AdditionalPay: {
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
          }
        },
        wrvuAdjustments: {
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
        }
      }
    });

    // Get market data for all specialties
    const marketData = await prisma.marketData.findMany();

    const providerMetrics = await Promise.all(providers.map(async (provider) => {
      // Get market data for the provider's specialty
      const marketData = await prisma.marketData.findFirst({
        where: { specialty: provider.specialty }
      });

      if (!marketData) {
        console.warn(`No market data found for specialty: ${provider.specialty}`);
        return null;
      }

      // Calculate monthly values
      const monthlyWRVUs = provider.wrvuData
        .filter(d => d.month === month)
        .reduce((total, d) => total + (d.value || 0), 0);

      const monthlyAdjustments = provider.wrvuAdjustments
        .filter(adj => adj.month === month)
        .reduce((total, adj) => total + (adj.value || 0), 0);

      // Calculate YTD values
      const ytdWRVUs = provider.wrvuData
        .reduce((total, d) => total + (d.value || 0), 0);

      const ytdAdjustments = provider.wrvuAdjustments
        .reduce((total, adj) => total + (adj.value || 0), 0);

      // Calculate monthly target using base salary and conversion factor
      const monthlyTarget = calculateMonthlyTarget(
        provider.baseSalary || 0,
        marketData.p50_cf || 55, // Default CF of 55 if not set
        provider.clinicalFte || 1.0
      );

      const monthlyTargetAdjustments = provider.targetAdjustments
        .filter(adj => adj.month === month)
        .reduce((total, adj) => total + (adj.value || 0), 0);

      // Calculate YTD target
      const ytdTarget = monthlyTarget * month;
      const ytdTargetAdjustments = provider.targetAdjustments
        .reduce((total, adj) => total + (adj.value || 0), 0);

      // Calculate total YTD wRVUs including adjustments
      const totalYTDWRVUs = ytdWRVUs + ytdAdjustments;
      const totalYTDTarget = ytdTarget + ytdTargetAdjustments;

      // Calculate percentiles based on YTD values
      const wrvuPercentile = calculateWRVUPercentile(
        totalYTDWRVUs,
        month,  // Current month for YTD
        provider.clinicalFte || 1.0,
        marketData
      );

      // Calculate YTD compensation
      const baseYTDComp = (provider.baseSalary || 0) * (month / 12);
      const ytdAdditionalPay = provider.AdditionalPay
        .reduce((total, pay) => total + (pay.amount || 0), 0);
      
      const totalYTDComp = baseYTDComp + ytdAdditionalPay;

      // Calculate compensation percentile based on annualized YTD comp
      const annualizedComp = (totalYTDComp / month) * 12;
      const compPercentile = calculateCompPercentile(
        annualizedComp,
        provider.clinicalFte || 1.0,
        marketData
      );

      return {
        id: provider.id,
        employeeId: provider.employeeId,
        name: `${provider.firstName} ${provider.lastName}`,
        specialty: provider.specialty,
        department: provider.department,
        compensationModel: provider.compensationModel,
        monthlyWRVUs: monthlyWRVUs + monthlyAdjustments,
        targetWRVUs: monthlyTarget + monthlyTargetAdjustments,
        ytdWRVUs,
        ytdTargetWRVUs: totalYTDTarget,
        planProgress: totalYTDTarget > 0 ? (totalYTDWRVUs / totalYTDTarget) * 100 : 0,
        wrvuPercentile,
        baseSalary: provider.baseSalary,
        totalCompensation: totalYTDComp,
        compPercentile
      };
    }));

    // Filter out null values from providers with missing market data
    const validMetrics = providerMetrics.filter(metric => metric !== null);

    // Calculate summary statistics
    const summary = {
      totalProviders: validMetrics.length,
      averageWRVUPercentile: validMetrics.reduce((sum, p) => sum + p.wrvuPercentile, 0) / validMetrics.length,
      averagePlanProgress: validMetrics.reduce((sum, p) => sum + p.planProgress, 0) / validMetrics.length,
      totalWRVUs: validMetrics.reduce((sum, p) => sum + p.monthlyWRVUs, 0),
      totalCompensation: validMetrics.reduce((sum, p) => sum + p.totalCompensation, 0)
    };

    // Add pagination info
    const pagination = {
      currentPage: 1,
      pageSize: 50,
      totalCount: validMetrics.length,
      totalPages: Math.ceil(validMetrics.length / 50)
    };

    return new Response(JSON.stringify({
      data: validMetrics,
      summary,
      pagination
    }), {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in monthly performance report:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
} 