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

export interface WRVUAdjustment {
  id: string;
  name: string;
  description?: string;
  providerId: string;
  year: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TargetAdjustment {
  id: string;
  name: string;
  description?: string;
  providerId: string;
  year: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WRVUAdjustmentResponse {
  success: boolean;
  error?: string;
  data?: WRVUAdjustment;
}

export interface TargetAdjustmentResponse {
  success: boolean;
  error?: string;
  data?: TargetAdjustment;
}

export interface WRVUHistory {
  id: string;
  wrvuDataId: string;
  changeType: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: Date;
  changedBy: string | null;
}

export interface WRVUData {
  id: string;
  year: number;
  month: number;
  value: number;
  hours: number;
  providerId: string;
  provider: Provider;
  createdAt: Date;
  updatedAt: Date;
  history?: WRVUHistory[];
  employee_id?: string;
  first_name?: string;
  last_name?: string;
  specialty?: string;
  jan?: number;
  feb?: number;
  mar?: number;
  apr?: number;
  may?: number;
  jun?: number;
  jul?: number;
  aug?: number;
  sep?: number;
  oct?: number;
  nov?: number;
  dec?: number;
} 