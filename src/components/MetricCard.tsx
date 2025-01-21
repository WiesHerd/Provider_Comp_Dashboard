import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: ReactNode;
}

export const MetricCard = ({ title, value, icon }: MetricCardProps) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className="bg-blue-50 rounded-lg p-2 mr-3">
              {icon}
            </div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          <p className="mt-3 text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}; 