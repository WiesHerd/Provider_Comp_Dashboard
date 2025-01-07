'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon, ChartBarIcon, CurrencyDollarIcon, BuildingOfficeIcon, ChartPieIcon } from '@heroicons/react/24/outline';

export default function ReportsSelectionPage() {
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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Menu
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-2">Reports</h1>
      <p className="text-gray-600 mb-8">Select a report to view detailed analytics and insights</p>

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