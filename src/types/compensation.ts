export interface CompensationChange {
  id: string;
  effectiveDate: string;
  previousSalary: number;
  newSalary: number;
  previousFTE: number;
  newFTE: number;
  conversionFactor: number;
  reason?: string;
  providerId: string;
} 