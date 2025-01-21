import { MonthlyGrid } from './MonthlyGrid';

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
  // Add more months as needed
];

export default {
  title: 'Components/MonthlyGrid',
  component: MonthlyGrid,
};

export const Default = () => (
  <div className="p-6 bg-gray-100">
    <MonthlyGrid provider={sampleProvider} metrics={sampleMetrics} />
  </div>
); 