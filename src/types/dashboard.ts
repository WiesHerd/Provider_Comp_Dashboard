export interface ProviderDashboardProps {
  provider: {
    firstName: string;
    middleInitial?: string;
    lastName: string;
    suffix?: string;
    employeeId: string;
    specialty: string;
    annualSalary: number;
    annualWRVUTarget: number;
    conversionFactor: number;
    hireDate: Date;
    fte?: number;
  };
}

export interface Provider {
  id: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  suffix?: string;
  employeeId: string;
  specialty: string;
  baseSalary: number;
  fte: number;
  clinicalFte?: number;
  compensationModel: 'Base Pay' | 'Standard' | 'Tiered CF';
  tieredCFConfigId?: string;
  hireDate: Date;
}

export interface MarketData {
  id: string;
  specialty: string;
  p25_wrvu: number;
  p50_wrvu: number;
  p75_wrvu: number;
  p90_wrvu: number;
  p25_total: number;
  p50_total: number;
  p75_total: number;
  p90_total: number;
  p25_comp: number;
  p50_comp: number;
  p75_comp: number;
  p90_comp: number;
  p25_cf: number;
  p50_cf: number;
  p75_cf: number;
  p90_cf: number;
  createdAt: string;
  updatedAt: string;
}

export interface Benchmark {
  percentile: number;
  value: number;
}

export interface MonthlyDetail {
  month: string;
  value: number;
  changed?: boolean;
  prorated?: boolean;
  oldAnnual?: number;
  newAnnual?: number;
  oldFTE?: number;
  newFTE?: number;
  oldDays?: number;
  newDays?: number;
  oldMonthly?: number;
  newMonthly?: number;
}

export interface CompensationModel {
  id: string;
  name: string;
  description: string;
}

export interface TierConfig {
  id: string;
  name: string;
  thresholdType: 'WRVU' | 'Percentile';
  tiers: Tier[];
}

export interface Tier {
  threshold: number;
  conversionFactor: number;
}

export interface RowStyle {
  borderBottom?: string;
  [key: string]: string | number | undefined;
}

export interface CompensationRow {
  component: string;
  isSystem?: boolean;
  isHeader?: boolean;
  ytd: number;
  [key: string]: any;
}

export interface GridRowStyle {
  borderBottom?: string;
  [key: string]: string | number | undefined;
}

export interface CompensationRowData {
  component: string;
  isSystem: boolean;
  isHeader?: boolean;
  type?: string;
  ytd: number;
  [key: string]: any;
}