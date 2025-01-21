export interface ProviderMetrics {
  id: string;
  providerId: string;
  year: number;
  month: number;
  actualWRVUs: number;
  rawMonthlyWRVUs: number;
  ytdWRVUs: number;
  ytdActualWRVUs: number;
  targetWRVUs: number;
  ytdTargetWRVUs: number;
  baseSalary: number;
  totalCompensation: number;
  incentivesEarned: number;
  holdbackAmount: number;
  wrvuPercentile: number;
  compPercentile: number;
  planProgress: number;
  monthsCompleted: number;
  momTrend: number;
  createdAt: Date;
  updatedAt: Date;
} 