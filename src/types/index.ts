export interface Provider {
  id: string;
  name: string;
  employeeId: string;
  specialty: string;
  providerType: string;
  fte: number;
  annualSalary: number;
  conversionFactor: number;
  annualWRVUTarget: number;
}

export interface MonthlyMetrics {
  month: string;
  actualWRVU: number;
  targetWRVU: number;
  difference: number;
}

export type PayoutPeriod = 'monthly' | 'quarterly' | 'biannual' | 'annual';

export interface PayoutConfig {
  period: PayoutPeriod;
  holdbackPercentage: number;
  conversionFactor: number;
} 