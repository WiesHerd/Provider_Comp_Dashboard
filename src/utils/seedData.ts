const specialties = [
  'Cardiology',
  'Orthopedics',
  'Internal Medicine',
  'Family Medicine',
  'Pediatrics',
  'Neurology',
  'Oncology',
  'Dermatology'
];

const generateProvider = (id: number) => {
  const specialty = specialties[Math.floor(Math.random() * specialties.length)];
  const baseSalary = 200000 + Math.floor(Math.random() * 200000);
  const fte = [0.5, 0.75, 0.8, 0.9, 1.0][Math.floor(Math.random() * 5)];
  
  return {
    id: `P${id}`,
    firstName: `John`,
    lastName: `Smith ${id}`,
    employeeId: `EMP${1000 + id}`,
    specialty,
    providerType: 'Physician',
    fte,
    annualSalary: baseSalary,
    conversionFactor: 45.00,
    annualWRVUTarget: 5000,
    hireDate: new Date(2023, Math.floor(Math.random() * 12), 1),
    metrics: generateMetrics()
  };
};

const generateMetrics = () => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const baseWRVU = 380 + Math.floor(Math.random() * 80); // Random between 380-460
    return {
      month: `2024-${String(i + 1).padStart(2, '0')}`,
      actualWRVU: baseWRVU,
      targetWRVU: 417,
      difference: baseWRVU - 417
    };
  });
  return months;
};

export const generateSampleData = (count: number = 50) => {
  const providers = Array.from({ length: count }, (_, i) => generateProvider(i + 1));
  
  // Group by specialty for sidebar
  const specialtyGroups = specialties.map(specialty => ({
    name: specialty,
    providers: providers
      .filter(p => p.specialty === specialty)
      .map(p => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}, MD`,
        employeeId: p.employeeId
      }))
  })).filter(group => group.providers.length > 0);

  return {
    providers,
    specialtyGroups
  };
}; 