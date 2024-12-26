export interface MarketData {
  specialty: string;
  // Total Compensation Percentiles
  p25_total: number;
  p50_total: number;
  p75_total: number;
  p90_total: number;
  // wRVU Percentiles
  p25_wrvu: number;
  p50_wrvu: number;
  p75_wrvu: number;
  p90_wrvu: number;
  // Conversion Factor Percentiles
  p25_cf: number;
  p50_cf: number;
  p75_cf: number;
  p90_cf: number;
}

export interface ProviderCompensation {
  id: string;
  providerId: string;
  baseSalary: number;
  specialty: string;
  baseConversionFactor: number;
  tieredConversionFactors?: {
    threshold: number; // percentile threshold
    cf: number;
  }[];
  customTargets?: {
    month: number; // 1-12
    target: number;
  }[];
  yearlyTarget?: number; // Calculated or custom
  monthlyTarget?: number; // Calculated or custom
}

export type CompensationModel = 'standard' | 'custom' | 'tiered'; 