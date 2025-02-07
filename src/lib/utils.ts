import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { MarketData } from '@/types/dashboard';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100)
}

export function formatDollars(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export const calculateWRVUPercentile = (
  actualWRVUs: number,
  monthsCompleted: number,
  fte: number,
  marketData: MarketData | MarketData[],
  specialty: string,
  clinicalFte?: number
): { percentile: number; nearestBenchmark: string } => {
  // Ensure marketData is an array
  const marketDataArray = Array.isArray(marketData) ? marketData : [marketData];
  
  // Find relevant market data for provider's specialty
  const relevantMarketData = marketDataArray.find(data => data.specialty === specialty);
  if (!relevantMarketData) {
    console.warn(`No market data found for specialty: ${specialty}`);
    return { percentile: 0, nearestBenchmark: 'N/A' };
  }

  // Annualize the wRVUs based on completed months
  const annualizedWRVUs = monthsCompleted > 0 
    ? (actualWRVUs / monthsCompleted) * 12 
    : actualWRVUs;

  // Use clinical FTE if provided, otherwise use total FTE
  const effectiveFTE = clinicalFte || fte;
  
  // Adjust for FTE if less than 1.0
  const fteAdjustedWRVUs = effectiveFTE < 1.0 
    ? annualizedWRVUs / effectiveFTE 
    : annualizedWRVUs;

  const benchmarks = [
    { percentile: 25, value: relevantMarketData.p25_wrvu || 0 },
    { percentile: 50, value: relevantMarketData.p50_wrvu || 0 },
    { percentile: 75, value: relevantMarketData.p75_wrvu || 0 },
    { percentile: 90, value: relevantMarketData.p90_wrvu || 0 }
  ];

  // If below 25th percentile
  if (fteAdjustedWRVUs < benchmarks[0].value) {
    const percentile = benchmarks[0].value > 0 
      ? (fteAdjustedWRVUs / benchmarks[0].value) * 25 
      : 0;
    return {
      percentile,
      nearestBenchmark: 'Below 25th'
    };
  }

  // If above 90th percentile
  if (fteAdjustedWRVUs > benchmarks[3].value) {
    const extraPercentile = benchmarks[3].value > 0 
      ? ((fteAdjustedWRVUs - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 0;
    const finalPercentile = Math.min(100, 90 + extraPercentile);
    return {
      percentile: finalPercentile,
      nearestBenchmark: 'Above 90th'
    };
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedWRVUs >= lower.value && fteAdjustedWRVUs <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedWRVUs - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      const percentile = range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
      return {
        percentile,
        nearestBenchmark: `${lower.percentile}th-${upper.percentile}th`
      };
    }
  }

  return { percentile: 0, nearestBenchmark: 'N/A' };
}; 