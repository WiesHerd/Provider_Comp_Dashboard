'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BuildingOfficeIcon, ChartBarIcon, ChartPieIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function ReportsSelectionPage() {
  const reports = [
    {
      title: 'Monthly Provider Performance Summary',
      description: 'Track and analyze provider productivity and compensation metrics',
      icon: ChartBarIcon,
      href: '/admin/reports/monthly-performance',
      color: 'bg-blue-50',
      iconColor: 'text-blue-700'
    },
    {
      title: 'Productivity Trends Report',
      description: 'View historical trends and patterns in provider productivity',
      icon: ChartPieIcon,
      href: '/admin/reports/productivity',
      color: 'bg-blue-50',
      iconColor: 'text-blue-700'
    },
    {
      title: 'Department Analytics',
      description: 'Analyze performance metrics by department and specialty',
      icon: BuildingOfficeIcon,
      href: '/admin/reports/department',
      color: 'bg-blue-50',
      iconColor: 'text-blue-700'
    },
    {
      title: 'Compensation Analysis',
      description: 'Review compensation data and market benchmarks',
      icon: CurrencyDollarIcon,
      href: '/admin/reports/compensation',
      color: 'bg-blue-50',
      iconColor: 'text-blue-700'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="mt-2 text-sm text-gray-700">
          Select a report to view detailed analytics and insights
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.title}
              href={report.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-sm hover:bg-gray-50"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ${report.color} ${report.iconColor} ring-4 ring-white`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {report.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {report.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 