'use client';

import React, { useState, useEffect } from 'react';
import { CalculatorIcon, PrinterIcon, CurrencyDollarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, ReferenceDot, CartesianGrid, ReferenceArea, Label } from 'recharts';

interface MarketData {
  id: string;
  specialty: string;
  p25_total: number;
  p50_total: number;
  p75_total: number;
  p90_total: number;
  p25_wrvu: number;
  p50_wrvu: number;
  p75_wrvu: number;
  p90_wrvu: number;
  p25_cf: number;
  p50_cf: number;
  p75_cf: number;
  p90_cf: number;
}

type MetricType = 'total' | 'wrvu' | 'cf';

// Print Layout Component
const PrintLayout = ({
  specialty,
  metric,
  inputValue,
  calculatedPercentile,
  marketData,
  selectedMetric,
  formatInputValue
}: {
  specialty: string;
  metric: string;
  inputValue: string;
  calculatedPercentile: number;
  marketData: MarketData[];
  selectedMetric: MetricType;
  formatInputValue: (value: string, metric: MetricType) => string;
}) => {
  const reportId = `PC${Date.now().toString().slice(-6)}`;
  const formattedDate = new Date().toLocaleDateString();
  const formattedTime = new Date().toLocaleTimeString();
  
  return (
    <div className="hidden print:block print:p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Provider Compensation Analytics</h1>
          <p className="text-sm text-gray-500">Market Data Intelligence</p>
        </div>
        <div className="text-sm text-gray-500 text-right">
          <div>Report ID: {reportId}</div>
          <div>{formattedDate}</div>
        </div>
      </div>

      {/* Parameters */}
      <div className="mt-4 flex gap-8">
        <div className="text-sm">
          <span className="text-gray-500">Specialty:</span>
          <span className="ml-2 font-medium">{specialty}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Metric:</span>
          <span className="ml-2 font-medium">{metric}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Value:</span>
          <span className="ml-2 font-medium">{formatInputValue(inputValue, selectedMetric)}</span>
        </div>
      </div>

      {/* Market Data Reference */}
      <div className="mt-6">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Market Data Reference</h2>
        <div className="grid grid-cols-4 gap-6">
          {['25th', '50th', '75th', '90th'].map((percentile) => {
            const key = `p${percentile.split('th')[0]}_${selectedMetric}`;
            const value = marketData.find(d => d.specialty === specialty)?.[key as keyof MarketData];
            return (
              <div key={percentile} className="bg-gray-50 rounded-lg p-5 border-2 border-gray-200">
                <p className="text-sm text-gray-500">{percentile} Percentile</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {value !== undefined ? formatInputValue(value.toString(), selectedMetric) : '-'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results Box */}
      <div className="mt-6 p-4 bg-gray-50 border rounded">
        <div className="text-lg">
          A {metric} of{' '}
          <span className="font-bold">{formatInputValue(inputValue, selectedMetric)}</span> for{' '}
          <span className="font-medium">{specialty}</span> is at the{' '}
          <span className="font-bold">{calculatedPercentile.toFixed(1)}th</span> percentile.
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Generated from Provider Compensation Dashboard • {formattedDate} {formattedTime}
        </div>
      </div>
    </div>
  );
};

// Add this new component above the main component
const PercentileGraph = ({
  marketData,
  selectedSpecialty,
  selectedMetric,
  inputValue,
  calculatedPercentile,
  formatValue,
  getMetricLabel
}: {
  marketData: MarketData[];
  selectedSpecialty: string;
  selectedMetric: MetricType;
  inputValue: string;
  calculatedPercentile: number | null;
  formatValue: (value: string | number) => string;
  getMetricLabel: (metric: MetricType) => string;
}) => {
  const data = marketData.find(d => d.specialty === selectedSpecialty);
  if (!data) return null;

  const p25 = data[`p25_${selectedMetric}`];
  const p50 = data[`p50_${selectedMetric}`];
  const p75 = data[`p75_${selectedMetric}`];
  const p90 = data[`p90_${selectedMetric}`];

  const curveData = [
    { percentile: 0, value: p25 * 0.5 },
    { percentile: 25, value: p25 },
    { percentile: 50, value: p50 },
    { percentile: 75, value: p75 },
    { percentile: 90, value: p90 },
    { percentile: 100, value: p90 * 1.2 }
  ];

  const inputValueNum = parseFloat(inputValue.replace(/[$,]/g, ''));

  // Calculate the value at the calculated percentile using linear interpolation
  const getValueAtPercentile = (percentile: number) => {
    if (percentile <= 25) {
      return p25 * 0.5 + (p25 - p25 * 0.5) * (percentile / 25);
    } else if (percentile <= 50) {
      return p25 + (p50 - p25) * ((percentile - 25) / 25);
    } else if (percentile <= 75) {
      return p50 + (p75 - p50) * ((percentile - 50) / 25);
    } else if (percentile <= 90) {
      return p75 + (p90 - p75) * ((percentile - 75) / 15);
    } else {
      return p90 + (p90 * 0.2) * ((percentile - 90) / 10);
    }
  };

  const formatYAxis = (value: number) => {
    if (selectedMetric === 'total') {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return selectedMetric === 'cf' ? `$${value.toFixed(1)}` : value.toLocaleString();
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={curveData} margin={{ top: 30, right: 10, left: 50, bottom: 35 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          
          {/* Background bands for quartiles */}
          <ReferenceArea x1={0} x2={25} fill="#f8fafc" fillOpacity={0.25} />
          <ReferenceArea x1={25} x2={50} fill="#f1f5f9" fillOpacity={0.25} />
          <ReferenceArea x1={50} x2={75} fill="#f8fafc" fillOpacity={0.25} />
          <ReferenceArea x1={75} x2={90} fill="#f1f5f9" fillOpacity={0.25} />
          <ReferenceArea x1={90} x2={100} fill="#f8fafc" fillOpacity={0.25} />
          
          <XAxis 
            dataKey="percentile" 
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 13, fill: '#64748b' }}
            ticks={[0, 25, 50, 75, 90, 100]}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={{ stroke: '#cbd5e1' }}
            label={{ 
              value: 'Percentile', 
              position: 'bottom', 
              offset: 25,
              style: { 
                textAnchor: 'middle',
                fontSize: '13px',
                fontWeight: 500,
                fill: '#475569'
              }
            }}
          />
          
          <YAxis
            tick={{ fontSize: 13, fill: '#64748b' }}
            tickFormatter={formatYAxis}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={{ stroke: '#cbd5e1' }}
            label={{ 
              value: selectedMetric === 'wrvu' ? 'Work RVUs' : 
                     selectedMetric === 'total' ? 'Total Cash Compensation' :
                     'Conversion Factor',
              angle: -90,
              position: 'left',
              offset: 35,
              style: { 
                textAnchor: 'middle',
                fontSize: '13px',
                fontWeight: 500,
                fill: '#475569'
              }
            }}
          />
          
          {/* Key percentile markers */}
          {[25, 50, 75, 90].map((percentile) => {
            const value = data[`p${percentile}_${selectedMetric}`];
            return (
              <ReferenceDot
                key={percentile}
                x={percentile}
                y={value}
                r={4}
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth={2}
              >
                <Label
                  value={formatYAxis(value)}
                  position="top"
                  offset={15}
                  style={{
                    fontSize: '12px',
                    fill: '#4f46e5',
                    fontWeight: 500,
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
                    backgroundColor: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                />
              </ReferenceDot>
            );
          })}
          
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#colorValue)"
          />
          
          {/* Red reference line for calculated percentile */}
          {calculatedPercentile !== null && (
            <g>
              <ReferenceLine
                segment={[
                  { x: calculatedPercentile, y: 0 },
                  { x: calculatedPercentile, y: getValueAtPercentile(calculatedPercentile) }
                ]}
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  position: 'insideBottomRight',
                  offset: 15,
                  value: selectedMetric === 'total' 
                    ? `$${(inputValueNum / 1000).toFixed(0)}K (${calculatedPercentile.toFixed(1)}th)`
                    : `${formatValue(inputValueNum)} (${calculatedPercentile.toFixed(1)}th)`,
                  fill: '#dc2626',
                  fontSize: 13,
                  fontWeight: 600,
                  style: {
                    backgroundColor: 'white',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }
                }}
              />
              <circle
                cx={calculatedPercentile}
                cy={getValueAtPercentile(calculatedPercentile)}
                r={4}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          )}
          
          <Tooltip 
            formatter={(value: number) => [formatValue(value), getMetricLabel(selectedMetric)]}
            labelFormatter={(label: number) => `${label}th Percentile`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            itemStyle={{
              color: '#1e293b',
              fontSize: '0.875rem'
            }}
            labelStyle={{
              color: '#64748b',
              fontSize: '0.75rem',
              marginBottom: '0.25rem'
            }}
            cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function PercentileCalculatorPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('total');
  const [inputValue, setInputValue] = useState<string>('');
  const [calculatedPercentile, setCalculatedPercentile] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) throw new Error('Failed to fetch market data');
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      setError('Failed to load market data');
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentile = () => {
    if (!selectedSpecialty || !inputValue) {
      setCalculatedPercentile(null);
      return;
    }

    const specialtyData = marketData.find(d => d.specialty === selectedSpecialty);
    if (!specialtyData) {
      setError('Specialty data not found');
      return;
    }

    // Convert input value to number by removing any formatting (commas, currency symbols)
    const cleanValue = inputValue.replace(/[^0-9.]/g, '');
    const value = parseFloat(cleanValue);
    
    if (isNaN(value)) {
      setError('Please enter a valid number');
      return;
    }

    // Get the percentile values for the selected metric
    const p25 = specialtyData[`p25_${selectedMetric}`];
    const p50 = specialtyData[`p50_${selectedMetric}`];
    const p75 = specialtyData[`p75_${selectedMetric}`];
    const p90 = specialtyData[`p90_${selectedMetric}`];

    // Calculate the percentile using linear interpolation
    let percentile: number;

    if (value <= p25) {
      // Below 25th percentile
      percentile = (value / p25) * 25;
    } else if (value <= p50) {
      // Between 25th and 50th
      percentile = 25 + ((value - p25) / (p50 - p25)) * 25;
    } else if (value <= p75) {
      // Between 50th and 75th
      percentile = 50 + ((value - p50) / (p75 - p50)) * 25;
    } else if (value <= p90) {
      // Between 75th and 90th
      percentile = 75 + ((value - p75) / (p90 - p75)) * 15;
    } else {
      // Above 90th percentile
      percentile = 90 + ((value - p90) / p90) * 10;
    }

    // Ensure percentile is between 0 and 100
    percentile = Math.min(100, Math.max(0, percentile));
    
    setCalculatedPercentile(percentile);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-numeric characters except decimal point and commas
    value = value.replace(/[^0-9.,]/g, '');

    // Handle decimal points
    const parts = value.split('.');
    if (parts.length > 2) return; // Don't allow multiple decimal points

    // Remove any commas from the number
    const cleanValue = value.replace(/,/g, '');
    if (!cleanValue) {
      setInputValue('');
      return;
    }

    // Format the whole number part with commas
    const [whole, decimal] = cleanValue.split('.');
    let formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Add back the decimal part if it exists
    if (decimal !== undefined) {
      formatted += '.' + decimal;
    }

    setInputValue(formatted);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!inputValue) {
      setInputValue('');
      return;
    }

    // Remove commas and $ for parsing
    const cleanValue = inputValue.replace(/[$,]/g, '');
    const number = parseFloat(cleanValue);

    if (!isNaN(number)) {
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      }).format(number);
      setInputValue(formatted);
    }
  };

  const formatValue = (value: string | number): string => {
    // If value is a string, clean it and convert to number
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[$,]/g, '')) 
      : value;

    if (isNaN(numValue)) return '0.00';

    switch (selectedMetric) {
      case 'wrvu':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: true
        }).format(numValue);
      
      case 'cf':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(numValue);
      
      default: // total
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(numValue);
    }
  };

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'total':
        return 'Total Cash Compensation';
      case 'wrvu':
        return 'wRVUs';
      case 'cf':
        return 'Conversion Factor';
    }
  };

  const clearInputs = () => {
    setSelectedSpecialty('');
    setSelectedMetric('total');
    setInputValue('');
    setCalculatedPercentile(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 space-y-6 p-8 print:!p-0">
      {/* Screen-only content */}
      <div className="print:hidden">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Percentile Calculator</h1>
            <p className="mt-1 text-sm text-gray-600">
              Calculate percentiles for compensation metrics based on market data.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            disabled={calculatedPercentile === null}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print Results
          </button>
        </div>

        {/* Calculator Section */}
        <div className="space-y-6 mt-6">
          {/* Input Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Specialty Select */}
                <div className="space-y-1.5">
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                    Specialty
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="specialty"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm appearance-none"
                    >
                      <option value="">Select a specialty</option>
                      {marketData.map((data) => (
                        <option key={data.id} value={data.specialty}>
                          {data.specialty}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Metric Select */}
                <div className="space-y-1.5">
                  <label htmlFor="metric" className="block text-sm font-medium text-gray-700">
                    Metric
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="metric"
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm appearance-none"
                    >
                      <option value="">Select a metric</option>
                      <option value="total">Total Cash Compensation</option>
                      <option value="wrvu">Work RVUs</option>
                      <option value="cf">Conversion Factor</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Value Input */}
                <div className="space-y-1.5">
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                    Value
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    {selectedMetric !== 'wrvu' && (
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                    )}
                    <input
                      type="text"
                      id="value"
                      value={inputValue}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={`block w-full rounded-lg border border-gray-300 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm ${
                        selectedMetric !== 'wrvu' ? 'pl-7' : 'pl-3'
                      }`}
                      placeholder={selectedMetric === 'wrvu' ? 'Enter RVUs' : 'Enter value'}
                    />
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={clearInputs}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={calculatePercentile}
                  disabled={!selectedSpecialty || !selectedMetric || !inputValue}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalculatorIcon className="w-4 h-4 mr-2" />
                  Calculate Percentile
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {calculatedPercentile !== null && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 space-y-6">
                {/* Graph */}
                <PercentileGraph
                  marketData={marketData}
                  selectedSpecialty={selectedSpecialty}
                  selectedMetric={selectedMetric}
                  inputValue={inputValue}
                  calculatedPercentile={calculatedPercentile}
                  formatValue={formatValue}
                  getMetricLabel={getMetricLabel}
                />

                {/* Market Data Reference */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Market Data Reference</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[25, 50, 75, 90].map((percentile) => {
                      const data = marketData.find(d => d.specialty === selectedSpecialty);
                      const value = data ? data[`p${percentile}_${selectedMetric}`] : 0;
                      return (
                        <div key={percentile} className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                          <div className="text-sm text-gray-600">{percentile}th Percentile</div>
                          <div className="mt-1 text-lg font-semibold">{formatValue(value)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Results Message */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-900">
                    A {getMetricLabel(selectedMetric)} of {formatValue(inputValue)} for {selectedSpecialty} is at the{' '}
                    <span className="font-semibold">{calculatedPercentile.toFixed(1)}th</span> percentile.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print-only content */}
      {calculatedPercentile !== null && (
        <div className="hidden print:block print:p-8">
          <style type="text/css" media="print">
            {`
              @page {
                size: landscape;
                margin: 0.5in;
              }
              @media print {
                body * {
                  visibility: hidden;
                }
                .print\\:block, .print\\:block * {
                  visibility: visible;
                }
                .print\\:block {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
              }
            `}
          </style>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Provider Compensation Analytics</h1>
                <p className="mt-1 text-sm text-gray-500">Market Data Intelligence</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Report ID: PC{Date.now().toString().slice(-6)}</div>
                <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Parameters Summary */}
            <div className="mt-8 grid grid-cols-3 gap-8">
              <div>
                <div className="text-sm font-medium text-gray-500">Specialty</div>
                <div className="mt-1 text-base">{selectedSpecialty}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Metric</div>
                <div className="mt-1 text-base">{getMetricLabel(selectedMetric)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Value</div>
                <div className="mt-1 text-base">{formatValue(inputValue)}</div>
              </div>
            </div>

            {/* Results Box */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <p className="text-lg text-blue-900">
                A {getMetricLabel(selectedMetric)} of{' '}
                <span className="font-semibold">{formatValue(inputValue)}</span> for{' '}
                <span className="font-medium">{selectedSpecialty}</span> is at the{' '}
                <span className="font-semibold">{calculatedPercentile.toFixed(1)}th</span> percentile.
              </p>
            </div>

            {/* Market Data Reference */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Data Reference</h2>
              <div className="grid grid-cols-4 gap-6">
                {['25th', '50th', '75th', '90th'].map((percentile) => {
                  const key = `p${percentile.split('th')[0]}_${selectedMetric}`;
                  const value = marketData.find(d => d.specialty === selectedSpecialty)?.[key as keyof MarketData];
                  return (
                    <div key={percentile} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                      <p className="text-sm font-medium text-gray-500">{percentile} Percentile</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">
                        {value !== undefined ? formatValue(value) : '-'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Generated from Provider Compensation Dashboard • {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 