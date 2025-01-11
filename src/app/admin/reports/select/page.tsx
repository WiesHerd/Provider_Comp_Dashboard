'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeftIcon, ChartBarIcon, CurrencyDollarIcon, BuildingOfficeIcon, ChartPieIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ReportsSelectionPage() {
  const { toast } = useToast();
  
  const handleRecalculateMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/calculate-all', {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to recalculate metrics');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: result.message,
        duration: 5000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to recalculate metrics',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const reports = [
    {
      title: 'Monthly Provider Performance Summary',
      description: 'Track and analyze provider productivity and compensation metrics',
      icon: ChartBarIcon,
      href: '/admin/reports/monthly-performance',
      color: 'bg-blue-100'
    },
    {
      title: 'Productivity Trends Report',
      description: 'View historical trends and patterns in provider productivity',
      icon: ChartPieIcon,
      href: '/admin/reports/productivity',
      color: 'bg-green-100'
    },
    {
      title: 'Department Analytics',
      description: 'Analyze performance metrics by department and specialty',
      icon: BuildingOfficeIcon,
      href: '/admin/reports/department',
      color: 'bg-purple-100'
    },
    {
      title: 'Compensation Analysis',
      description: 'Review compensation data and market benchmarks',
      icon: CurrencyDollarIcon,
      href: '/admin/reports/compensation',
      color: 'bg-orange-100'
    }
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Reports</h1>
          <p className="text-gray-600">Select a report to view detailed analytics and insights</p>
        </div>
        <button
          onClick={handleRecalculateMetrics}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Recalculate Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.title} href={report.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${report.color}`}>
                      <Icon className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium">{report.title}</h2>
                      <p className="text-gray-600 mt-1">{report.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 