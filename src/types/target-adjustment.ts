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

export interface TargetAdjustmentBase {
  id?: string;
  name: string;
  description?: string;
  year: number;
  providerId: string;
}

export interface TargetAdjustment extends TargetAdjustmentBase {
  month: number;
  value: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TargetAdjustmentFormData extends TargetAdjustmentBase {
  monthlyValues: MonthlyValues;
}

export interface TargetAdjustmentResponse {
  success: boolean;
  data?: TargetAdjustment & MonthlyValues;
  error?: string;
} 