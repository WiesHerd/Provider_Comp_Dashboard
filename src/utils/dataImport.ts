interface Provider {
  employeeId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  fte: number;
  baseSalary: number;
  conversionFactor: number;
  annualWRVUTarget: number;
  startDate: string;
}

interface MonthlyWRVU {
  employeeId: string;
  month: string;
  actualWRVUs: number;
  adjustments?: number;
  comments?: string;
}

// Parse provider master data
export const parseProviderMaster = (data: any[]): Provider[] => {
  return data.map(row => ({
    employeeId: row.EmployeeID,
    firstName: row.FirstName,
    lastName: row.LastName,
    specialty: row.Specialty,
    fte: parseFloat(row.FTE),
    baseSalary: parseFloat(row.BaseSalary),
    conversionFactor: parseFloat(row.ConversionFactor),
    annualWRVUTarget: parseFloat(row.AnnualWRVUTarget),
    startDate: row.StartDate
  }));
};

// Group providers by specialty for sidebar
export const groupProvidersBySpecialty = (providers: Provider[]) => {
  const grouped = new Map<string, Provider[]>();
  
  providers.forEach(provider => {
    if (!grouped.has(provider.specialty)) {
      grouped.set(provider.specialty, []);
    }
    grouped.get(provider.specialty)!.push(provider);
  });
  
  return grouped;
};

// Combine provider and wRVU data for dashboard
export const createDashboardData = (
  provider: Provider, 
  wrvuData: MonthlyWRVU[]
) => {
  const providerWRVUs = wrvuData.filter(w => w.employeeId === provider.employeeId);
  
  const ytdWRVUs = providerWRVUs.reduce((sum, month) => 
    sum + month.actualWRVUs + (month.adjustments || 0), 0);

  return {
    id: provider.employeeId,
    name: `${provider.firstName} ${provider.lastName}`,
    specialty: provider.specialty,
    employeeId: provider.employeeId,
    fte: provider.fte,
    baseSalary: provider.baseSalary,
    conversionFactor: provider.conversionFactor,
    annualWRVUTarget: provider.annualWRVUTarget,
    ytdWRVUs,
    monthlyMetrics: providerWRVUs
  };
};

// Function to parse Excel/CSV data
export const parseMonthlyWRVUs = (data: any[]): MonthlyWRVU[] => {
  return data.map(row => ({
    employeeId: row.EmployeeID,
    month: row.Month,
    actualWRVUs: parseFloat(row.ActualWRVUs),
    adjustments: row.Adjustments ? parseFloat(row.Adjustments) : 0,
    comments: row.Comments || ''
  }));
};

// Function to group wRVUs by provider
export const groupWRVUsByProvider = (wrvus: MonthlyWRVU[]) => {
  const grouped = new Map();
  
  wrvus.forEach(wrvu => {
    if (!grouped.has(wrvu.employeeId)) {
      grouped.set(wrvu.employeeId, []);
    }
    grouped.get(wrvu.employeeId).push(wrvu);
  });
  
  return grouped;
}; 
    ytdWRVUs,
    monthlyMetrics: providerWRVUs
  };
};

// Function to parse Excel/CSV data
export const parseMonthlyWRVUs = (data: any[]): MonthlyWRVU[] => {
  return data.map(row => ({
    employeeId: row.EmployeeID,
    month: row.Month,
    actualWRVUs: parseFloat(row.ActualWRVUs),
    adjustments: row.Adjustments ? parseFloat(row.Adjustments) : 0,
    comments: row.Comments || ''
  }));
};

// Function to group wRVUs by provider
export const groupWRVUsByProvider = (wrvus: MonthlyWRVU[]) => {
  const grouped = new Map();
  
  wrvus.forEach(wrvu => {
    if (!grouped.has(wrvu.employeeId)) {
      grouped.set(wrvu.employeeId, []);
    }
    grouped.get(wrvu.employeeId).push(wrvu);
  });
  
  return grouped;
}; 
    annualWRVUTarget: provider.annualWRVUTarget,
}; 

  return {
    id: provider.employeeId,
    name: `${provider.firstName} ${provider.lastName}`,
    specialty: provider.specialty,
    employeeId: provider.employeeId,
    fte: provider.fte,
}; 
) => {
  const providerWRVUs = wrvuData.filter(w => w.employeeId === provider.employeeId);
  
  const ytdWRVUs = providerWRVUs.reduce((sum, month) => 
}; 
  return grouped;
}; 
}; 
    }
    grouped.get(wrvu.employeeId).push(wrvu);
  });
  
  return grouped;
}; 
      grouped.set(wrvu.employeeId, []);
    }
    grouped.get(wrvu.employeeId).push(wrvu);
  });
  
  return grouped;
}; 
  });
  
  return grouped;
}; 
}; 