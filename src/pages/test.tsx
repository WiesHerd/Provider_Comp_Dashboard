import React from 'react';
import MonthlyGrid from '../components/MonthlyGrid/MonthlyGrid';

const TestPage = () => {
  const sampleProvider = {
    id: '1',
    name: 'Dr. Smith',
    employeeId: 'EMP123',
    specialty: 'Cardiology',
    providerType: 'Physician',
    fte: 1.0,
    annualSalary: 250000,
    conversionFactor: 45,
    annualWRVUTarget: 5000
  };

  const sampleMetrics = [
    {
      month: 'January 2024',
      actualWRVU: 450,
      targetWRVU: 416,
      difference: 34,
    },
    {
      month: 'February 2024',
      actualWRVU: 380,
      targetWRVU: 416,
      difference: -36,
    },
    {
      month: 'March 2024',
      actualWRVU: 520,
      targetWRVU: 416,
      difference: 104,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Provider Dashboard Test</h1>
        <MonthlyGrid provider={sampleProvider} metrics={sampleMetrics} />
      </div>
    </div>
  );
};

export default TestPage; 