import { MonthlyValues } from './wrvu-adjustment';

export interface TargetAdjustmentBase {
  id?: string;
  name: string;
  description?: string;
  year: number;
  providerId: string;
}

export interface TargetAdjustment extends TargetAdjustmentBase, MonthlyValues {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TargetAdjustmentFormData extends TargetAdjustmentBase {
  monthlyValues: MonthlyValues;
}

export interface TargetAdjustmentResponse {
  success: boolean;
  data?: TargetAdjustment;
  error?: string;
} 