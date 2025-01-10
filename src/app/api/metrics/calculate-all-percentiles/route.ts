import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ProviderUpdate {
  providerId: string;
  name: string;
  wrvuPercentile: number;
  compPercentile: number;
  monthsUpdated: number;
}

function calculateTotalCompPercentile(totalComp: number, marketData: any, specialty: string, fte: number): number {
  if (!marketData || !marketData.length) return 0;
  
  const matchingMarket = marketData.find((data: any) => data.specialty === specialty);
  if (!matchingMarket) return 0;

  // Adjust total comp for FTE if less than 1.0
  const fteAdjustedTotalComp = fte < 1.0 ? totalComp / fte : totalComp;

  const benchmarks = [
    { percentile: 25, value: matchingMarket.p25_total || 0 },
    { percentile: 50, value: matchingMarket.p50_total || 0 },
    { percentile: 75, value: matchingMarket.p75_total || 0 },
    { percentile: 90, value: matchingMarket.p90_total || 0 }
  ];

  // If below 25th percentile
  if (fteAdjustedTotalComp < benchmarks[0].value) {
    return benchmarks[0].value > 0 ? (fteAdjustedTotalComp / benchmarks[0].value) * 25 : 0;
  }

  // If above 90th percentile
  if (fteAdjustedTotalComp > benchmarks[3].value) {
    const percentile = benchmarks[3].value > 0 
      ? 90 + ((fteAdjustedTotalComp - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 90;
    return Math.min(100, percentile);
  }

  // Find which benchmarks we're between
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedTotalComp >= lower.value && fteAdjustedTotalComp <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedTotalComp - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      return range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
    }
  }

  return 0;
}

function calculateWRVUPercentile(actualWRVUs: number, monthsCompleted: number, fte: number, marketData: any, specialty: string): number {
  if (!marketData || !marketData.length) return 0;
  
  const matchingMarket = marketData.find((data: any) => data.specialty === specialty);
  if (!matchingMarket) return 0;

  // Annualize wRVUs
  const annualizedWRVUs = monthsCompleted > 0 
    ? (actualWRVUs / monthsCompleted) * 12 
    : 0;

  // Adjust for FTE
  const fteAdjustedWRVUs = fte < 1.0 
    ? annualizedWRVUs / fte 
    : annualizedWRVUs;

  const benchmarks = [
    { percentile: 25, value: matchingMarket.p25_wrvu || 0 },
    { percentile: 50, value: matchingMarket.p50_wrvu || 0 },
    { percentile: 75, value: matchingMarket.p75_wrvu || 0 },
    { percentile: 90, value: matchingMarket.p90_wrvu || 0 }
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

export async function POST(request: Request) {
  try {
    // Get all providers
    const providers = await prisma.provider.findMany();
    
    // Get market data
    const marketData = await prisma.marketData.findMany();

    // Get current year
    const currentYear = 2024;

    let updatedCount = 0;
    const updates: ProviderUpdate[] = [];

    // Process each provider
    for (const provider of providers) {
      // Get provider metrics for the current year
      const metrics = await prisma.providerMetrics.findMany({
        where: {
          providerId: provider.id,
          year: currentYear
        },
        orderBy: {
          month: 'asc'
        }
      });

      if (metrics.length === 0) continue;

      // Calculate total actual wRVUs and months completed
      const monthsCompleted = metrics.length;
      const totalActualWRVUs = metrics.reduce((sum, m) => sum + (m.actualWRVUs || 0), 0);
      const totalCompensation = metrics[metrics.length - 1]?.totalCompensation || 0;

      // Calculate percentiles
      const wrvuPercentile = calculateWRVUPercentile(
        totalActualWRVUs,
        monthsCompleted,
        provider.clinicalFte,
        marketData,
        provider.specialty
      );

      const compPercentile = calculateTotalCompPercentile(
        totalCompensation,
        marketData,
        provider.specialty,
        provider.fte
      );

      // Update all months for this provider
      const update = await prisma.providerMetrics.updateMany({
        where: {
          providerId: provider.id,
          year: currentYear
        },
        data: {
          wrvuPercentile,
          compPercentile
        }
      });

      updatedCount += update.count;
      updates.push({
        providerId: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        wrvuPercentile,
        compPercentile,
        monthsUpdated: update.count
      });
    }

    return NextResponse.json({
      success: true,
      totalUpdated: updatedCount,
      updates
    });

  } catch (error) {
    console.error('Error calculating percentiles:', error);
    return NextResponse.json(
      { error: 'Failed to calculate percentiles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 