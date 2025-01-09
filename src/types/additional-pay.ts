export interface MonthlyValues {
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
}

export interface AdditionalPayBase {
  id?: string;
  name: string;
  description?: string;
  year: number;
  providerId: string;
}

export interface AdditionalPay extends AdditionalPayBase {
  month: number;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdditionalPayFormData extends AdditionalPayBase {
  monthlyValues: MonthlyValues;
}

export interface AdditionalPayResponse {
  success: boolean;
  data?: AdditionalPay & MonthlyValues;
  error?: string;
} 