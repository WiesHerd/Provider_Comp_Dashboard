'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import Loading from '@/app/loading';

interface MonthlyPerformanceTableProps {
  onBack: () => void;
}

interface Provider {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  clinicalFTE: number;
  actualWRVUs: number;
  targetWRVUs: number;
  percentOfTarget: number;
  trend: number;
  ytdProgress: number;
  wrvuPercentile: number;
  tccPercentile: number;
  baseSalary: number;
  totalCompensation: number;
  incentiveAmount: number;
  holdbackAmount: number;
  ytdIncentives: number;
  marketData?: any;
}

export default function MonthlyPerformanceTable({ onBack }: MonthlyPerformanceTableProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch providers
        const params = new URLSearchParams({
          period: selectedTimeframe,
          specialty: selectedDepartment
        });
        
        const providersResponse = await fetch(`/api/providers?${params}`);
        if (!providersResponse.ok) throw new Error('Failed to fetch providers');
        const providersData = await providersResponse.json();

        // Fetch market data
        const marketResponse = await fetch('/api/market-data');
        if (!marketResponse.ok) throw new Error('Failed to fetch market data');
        const marketDataList = await marketResponse.json();

        // Attach market data to each provider
        const providersWithMarketData = providersData.map((provider: Provider) => ({
          ...provider,
          marketData: marketDataList.find((m: any) => m.specialty === provider.specialty)
        }));

        setProviders(providersWithMarketData);
        setMarketData(marketDataList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, [selectedTimeframe, selectedDepartment]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1
    }).format(value / 100);
  };

  const calculateWRVUPercentile = (actualWRVUs: number, monthsCompleted: number, fte: number, marketData: any): number => {
    if (!marketData) {
      return 0;
    }

    // Annualize wRVUs
    const annualizedWRVUs = monthsCompleted > 0 
      ? (actualWRVUs / monthsCompleted) * 12 
      : 0;

    // Adjust for FTE
    const fteAdjustedWRVUs = fte < 1.0 
      ? annualizedWRVUs / fte 
      : annualizedWRVUs;

    const benchmarks = [
      { percentile: 25, value: marketData.p25_wrvu || 0 },
      { percentile: 50, value: marketData.p50_wrvu || 0 },
      { percentile: 75, value: marketData.p75_wrvu || 0 },
      { percentile: 90, value: marketData.p90_wrvu || 0 }
    ];

    // If below 25th percentile
    if (fteAdjustedWRVUs < benchmarks[0].value) {
      return benchmarks[0].value > 0 ? (fteAdjustedWRVUs / benchmarks[0].value) * 25 : 0;
    }

    // If above 90th percentile
    if (fteAdjustedWRVUs > benchmarks[3].value) {
      const extraPercentile = benchmarks[3].value > 0 
        ? ((fteAdjustedWRVUs - benchmarks[3].value) / benchmarks[3].value) * 10 
        : 0;
      return Math.min(100, 90 + extraPercentile);
    }

    // Find which benchmarks we're between and interpolate
    for (let i = 0; i < benchmarks.length - 1; i++) {
      const lower = benchmarks[i];
      const upper = benchmarks[i + 1];
      if (fteAdjustedWRVUs >= lower.value && fteAdjustedWRVUs <= upper.value) {
        const range = upper.value - lower.value;
        const position = fteAdjustedWRVUs - lower.value;
        const percentileRange = upper.percentile - lower.percentile;
        return range > 0 
          ? lower.percentile + (position / range) * percentileRange 
          : lower.percentile;
      }
    }

    return 0;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Button
        variant="outline"
        className="mb-4"
        onClick={onBack}
      >
        ← Back to Reports
      </Button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monthly Provider Performance Summary</h2>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive view of provider performance metrics for the current month
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-gray-600">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <Select
              value={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="year">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="orthopedics">Orthopedics</SelectItem>
                <SelectItem value="pediatrics">Pediatrics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinical FTE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual wRVUs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target wRVUs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MoM Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YTD Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">wRVU %ile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TCC %ile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Comp</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                    No providers found
                  </td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link 
                        href={`/provider/${provider.employeeId}`} 
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {provider.firstName} {provider.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {provider.specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {provider.clinicalFTE?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {provider.actualWRVUs?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {provider.targetWRVUs?.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      provider.percentOfTarget >= 100 ? 'text-green-600' :
                      provider.percentOfTarget >= 90 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatPercent(provider.percentOfTarget)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      provider.trend > 0 ? 'text-green-600' :
                      provider.trend < 0 ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {provider.trend > 0 ? '↑' : provider.trend < 0 ? '↓' : '–'} {Math.abs(provider.trend).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatPercent(provider.ytdProgress)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatPercent(calculateWRVUPercentile(
                        provider.actualWRVUs,
                        1, // months completed
                        provider.clinicalFTE,
                        provider.marketData
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatPercent(provider.tccPercentile)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(provider.totalCompensation)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 