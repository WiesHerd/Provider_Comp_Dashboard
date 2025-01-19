'use client';

import React, { useState, useEffect } from 'react';
import { CalculatorIcon, PrinterIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

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
        <div className="grid grid-cols-4 gap-4">
          {['25th', '50th', '75th', '90th'].map((percentile) => {
            const key = `p${percentile.split('th')[0]}_${selectedMetric}`;
            const value = marketData.find(d => d.specialty === specialty)?.[key as keyof MarketData];
            return (
              <div key={percentile} className="bg-white rounded border border-gray-200 p-3">
                <div className="text-sm text-gray-500">{percentile} Percentile</div>
                <div className="mt-1 text-lg font-semibold">
                  {value !== undefined ? formatInputValue(value.toString(), selectedMetric) : '-'}
                </div>
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

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setError('Please enter a valid number');
      return;
    }

    // Get the percentile values for the selected metric
    const percentileValues = {
      p25: specialtyData[`p25_${selectedMetric}`],
      p50: specialtyData[`p50_${selectedMetric}`],
      p75: specialtyData[`p75_${selectedMetric}`],
      p90: specialtyData[`p90_${selectedMetric}`]
    };

    // Calculate the percentile using linear interpolation
    let percentile: number;

    if (value <= percentileValues.p25) {
      percentile = 25 * (value / percentileValues.p25);
    } else if (value <= percentileValues.p50) {
      percentile = 25 + 25 * ((value - percentileValues.p25) / (percentileValues.p50 - percentileValues.p25));
    } else if (value <= percentileValues.p75) {
      percentile = 50 + 25 * ((value - percentileValues.p50) / (percentileValues.p75 - percentileValues.p50));
    } else if (value <= percentileValues.p90) {
      percentile = 75 + 15 * ((value - percentileValues.p75) / (percentileValues.p90 - percentileValues.p75));
    } else {
      percentile = 90 + 10 * ((value - percentileValues.p90) / percentileValues.p90);
    }

    setCalculatedPercentile(Math.min(100, Math.max(0, percentile)));
    setError(null);
  };

  const formatInputValue = (value: string, metric: MetricType): string => {
    const numValue = Number(value) || 0;
    
    if (metric === 'wrvu') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
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

  return (
    <div className="w-full">
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .print-layout, .print-layout * {
            visibility: visible;
          }
          .print-layout {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Screen Layout */}
      <div className="print:hidden">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Percentile Calculator</h1>
            <p className="mt-2 text-sm text-gray-600">
              Calculate percentiles for compensation metrics based on market data.
            </p>
          </div>
          {calculatedPercentile !== null && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PrinterIcon className="mr-2 h-5 w-5" />
              Print Results
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg print:shadow-none print:rounded-none">
            <div className="p-6 print:p-0">
              {/* Main Form Container */}
              <div className="max-w-4xl mx-auto print:max-w-none print:w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Specialty Selection */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 print:bg-transparent">
                    <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Specialty
                    </label>
                    <select
                      id="specialty"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
                    >
                      <option value="">Select a specialty</option>
                      {marketData.map((data) => (
                        <option key={data.id} value={data.specialty}>
                          {data.specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Metric Selection */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 print:bg-transparent">
                    <label htmlFor="metric" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Metric
                    </label>
                    <select
                      id="metric"
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
                    >
                      <option value="total">Total Cash Compensation</option>
                      <option value="wrvu">wRVUs</option>
                      <option value="cf">Conversion Factor</option>
                    </select>
                  </div>

                  {/* Value Input */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 print:bg-transparent">
                    <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Value
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      {selectedMetric !== 'wrvu' && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                      )}
                      <input
                        type="number"
                        id="value"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11 ${
                          selectedMetric !== 'wrvu' ? 'pl-7' : ''
                        }`}
                        placeholder="Enter value"
                        step={selectedMetric === 'cf' ? '0.1' : '1'}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Remove print button from here */}
                <div className="mt-6 flex justify-center print:hidden">
                  <button
                    type="button"
                    onClick={calculatePercentile}
                    disabled={!selectedSpecialty || !inputValue}
                    className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <CalculatorIcon className="mr-2 h-5 w-5" />
                    Calculate Percentile
                  </button>
                </div>

                {/* Results */}
                {calculatedPercentile !== null && selectedSpecialty && (
                  <div className="mt-8 print:mt-4">
                    {/* Print Header */}
                    <div className="hidden print:block print:mb-6">
                      <h1 className="text-2xl font-semibold text-gray-900">Percentile Calculator Results</h1>
                      <p className="mt-2 text-sm text-gray-600">
                        Generated on {new Date().toLocaleDateString()}
                      </p>
                    </div>

                    <div className="rounded-md bg-blue-50 p-4 print:bg-transparent print:border print:border-gray-200 print:shadow-none">
                      <div className="flex">
                        <div className="flex-shrink-0 print:hidden">
                          <CalculatorIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3 print:ml-0">
                          <h3 className="text-sm font-medium text-blue-800 print:text-gray-900">Results</h3>
                          <div className="mt-2 text-sm text-blue-700 print:text-gray-600">
                            <p>
                              A {getMetricLabel(selectedMetric)} of{' '}
                              <span className="font-semibold text-blue-900 print:text-gray-900">
                                {formatInputValue(inputValue, selectedMetric)}
                              </span>{' '}
                              for {selectedSpecialty} is at the{' '}
                              <span className="font-semibold text-blue-900 print:text-gray-900">
                                {calculatedPercentile.toFixed(1)}th
                              </span>{' '}
                              percentile.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Market Data Reference */}
                    <div className="mt-6 print:mt-6">
                      <h4 className="text-sm font-medium text-gray-900 print:text-base">Market Data Reference</h4>
                      <div className="mt-3 grid grid-cols-4 gap-3 print:gap-6 print:mt-4">
                        {['25th', '50th', '75th', '90th'].map((percentile) => {
                          const key = `p${percentile.split('th')[0]}_${selectedMetric}`;
                          const value = marketData.find(d => d.specialty === selectedSpecialty)?.[key as keyof MarketData];
                          return (
                            <div key={percentile} className="bg-white rounded-lg border border-gray-200 p-3 print:p-4 print:shadow-none">
                              <div className="text-sm text-gray-500 print:text-gray-600">{percentile} Percentile</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">
                                {value !== undefined ? formatInputValue(value.toString(), selectedMetric) : '-'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Print Footer */}
                    <div className="hidden print:block print:mt-6 print:pt-6 print:border-t print:border-gray-200">
                      <p className="text-sm text-gray-500">
                        This report was generated from the Provider Compensation Dashboard on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Layout */}
      {calculatedPercentile !== null && (
        <div className="print-layout">
          <PrintLayout
            specialty={selectedSpecialty}
            metric={getMetricLabel(selectedMetric)}
            inputValue={inputValue}
            calculatedPercentile={calculatedPercentile}
            marketData={marketData}
            selectedMetric={selectedMetric}
            formatInputValue={formatInputValue}
          />
        </div>
      )}
    </div>
  );
} 