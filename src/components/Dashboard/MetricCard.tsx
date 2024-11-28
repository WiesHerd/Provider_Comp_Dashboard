import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number;
    text: string;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  prefix = '', 
  suffix = '',
  trend 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">
          {prefix}{value.toLocaleString()}{suffix}
        </p>
      </div>
      {trend && (
        <div className="mt-2">
          <span className={`text-sm ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard; 