import React, { useEffect, useState } from 'react';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface WRVUGaugeProps {
  title: string;
  value: number;
  subtitle: string;
  size?: 'small' | 'medium' | 'large';
  showTrend?: boolean;
}

const WRVUGauge: React.FC<WRVUGaugeProps> = ({ 
  title, 
  value, 
  subtitle, 
  size = 'medium',
  showTrend = false 
}) => {
  const [mounted, setMounted] = useState(false);
  const radius = size === 'large' ? 45 : size === 'medium' ? 40 : 35;
  const strokeWidth = size === 'large' ? 8 : size === 'medium' ? 7 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Title */}
      <div className="text-sm font-medium text-gray-700 mb-4">
        {title}
      </div>
      
      {/* Gauge Container */}
      <div className="relative w-32 h-32 mb-2">
        {/* SVG Gauge */}
        <svg
          className={`transform -rotate-90 transition-all duration-1000 ease-out ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          width="100%"
          height="100%"
          viewBox={`0 0 ${radius * 2 + strokeWidth * 2} ${radius * 2 + strokeWidth * 2}`}
        >
          {/* Background circle */}
          <circle
            className="text-gray-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
          />

          {/* Progress circle */}
          <circle
            className="transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            strokeLinecap="round"
            stroke="#3B82F6"
            fill="transparent"
            r={radius}
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
          />
        </svg>

        {/* Central Value Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-semibold text-gray-900">
            {mounted ? value.toFixed(1) : '0.0'}%
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <div className="text-xs text-gray-500 text-center">
        {subtitle}
      </div>
    </div>
  );
};

export default WRVUGauge; 