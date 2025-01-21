export interface ProviderMetrics {
  id: string;
  providerId: string;
  providerName: string;
  specialty: string;
  clinicalFte: number;
  actualWRVUs: number;
  rawMonthlyWRVUs: number;
  ytdWRVUs: number;
  targetWRVUs: number;
  baseSalary: number;
  totalCompensation: number;
  incentivesEarned: number;
  holdbackAmount: number;
  wrvuPercentile: number;
  compPercentile: number;
  planProgress: number;
  ytdProgress: number;
  ytdTargetProgress: number;
  incentivePercentage: number;
  clinicalUtilization: number;
  year: number;
  month: number;
} 