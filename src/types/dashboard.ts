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
  name: string;
  employeeId: string;
  providerType: 'Physician' | 'APP';
  specialty?: string;
  hireDate: Date;
}