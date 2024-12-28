export interface WRVUAdjustmentBase {
  id?: string;
  name: string;
  description?: string;
  year: number;
  providerId: string;
}

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

export interface WRVUAdjustment extends WRVUAdjustmentBase, MonthlyValues {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WRVUAdjustmentFormData extends WRVUAdjustmentBase {
  monthlyValues: MonthlyValues;
}

export interface WRVUAdjustmentResponse {
  success: boolean;
  data?: WRVUAdjustment;
  error?: string;
} 