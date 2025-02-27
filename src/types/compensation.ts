export interface CompensationChange {
  id?: string;
  effectiveDate: string;
  previousSalary: number;
  newSalary: number;
  previousFTE: number;
  newFTE: number;
  previousConversionFactor: number;
  newConversionFactor: number;
  reason?: string;
  providerId?: string;
  compensationModel?: string;
  tieredCFConfigId?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 