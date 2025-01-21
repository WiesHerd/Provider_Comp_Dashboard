'use client';

import { useState, useEffect } from 'react';
import { ColDef } from 'ag-grid-community';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ArrowLeftIcon } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import MonthlyPerformanceReport, { monthlyPerformanceColumnDefs } from './components/MonthlyPerformanceReport';
import { ProviderMetrics } from './types';

interface ReportViewerProps {
  reportType: string;
  subType: string | null;
  onClose: () => void;
}

export default function ReportViewer({ reportType, subType, onClose }: ReportViewerProps) {
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPerformance, setSelectedPerformance] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get current date info
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Fetch metrics
      const metricsResponse = await fetch(`/api/provider-metrics?year=${currentYear}&month=${currentMonth}`);
      if (!metricsResponse.ok) throw new Error('Failed to fetch metrics');
      const metricsData = await metricsResponse.json();
      if (!Array.isArray(metricsData)) throw new Error('Invalid metrics data');

      // Fetch analytics
      const analyticsResponse = await fetch(`/api/provider-analytics?year=${currentYear}&month=${currentMonth}`);
      if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics');
      const analyticsData = await analyticsResponse.json();
      if (!Array.isArray(analyticsData)) throw new Error('Invalid analytics data');

      // Combine data
      const combinedData = metricsData.map(metric => {
        const analytics = analyticsData.find(a => a.providerId === metric.providerId);
        
        return {
          ...metric,
          ytdProgress: analytics?.ytdProgress || 0,
          ytdTargetProgress: analytics?.ytdTargetProgress || 0,
          incentivePercentage: analytics?.incentivePercentage || 0,
          clinicalUtilization: analytics?.clinicalUtilization || 0
        };
      });

      setMetrics(combinedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = (data: ProviderMetrics[], columnDefs: ColDef<ProviderMetrics>[], filename: string) => {
    const headers = columnDefs.map(col => col.headerName || col.field).join(',');
    const rows = data.map(row => {
      return columnDefs.map(col => {
        if (!col.field) return '';
        const value = row[col.field as keyof ProviderMetrics];
        if (typeof value === 'number') {
          if (col.field.toLowerCase().includes('percent') || col.field === 'wrvuPercentile' || col.field === 'compPercentile') {
            return `"${value.toFixed(1)}%"`;
          }
          if (col.field.toLowerCase().includes('salary') || col.field.toLowerCase().includes('compensation') || 
              col.field === 'incentivesEarned' || col.field === 'holdbackAmount') {
            return `"${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}"`;
          }
          return `"${value.toFixed(2)}"`;
        }
        return `"${value || ''}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const renderReport = () => {
    switch (reportType) {
      case 'performance':
        if (subType === 'monthly') {
          return (
            <MonthlyPerformanceReport
              metrics={metrics}
              selectedSpecialty={selectedSpecialty}
              setSelectedSpecialty={setSelectedSpecialty}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedPerformance={selectedPerformance}
              setSelectedPerformance={setSelectedPerformance}
              handleExportCSV={handleExportCSV}
            />
          );
        }
        break;

      case 'compensation':
        if (subType === 'metrics') {
          return (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Provider Metrics</CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportCSV(metrics, monthlyPerformanceColumnDefs, 'provider_metrics.csv')}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="ag-theme-alpine w-full" style={{ height: 'calc(100vh - 300px)' }}>
                  <AgGridReact
                    rowData={metrics}
                    columnDefs={monthlyPerformanceColumnDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                      floatingFilter: true
                    }}
                    animateRows={true}
                    pagination={true}
                    paginationPageSize={20}
                  />
                </div>
              </CardContent>
            </Card>
          );
        }
        break;

      default:
        return <div>Report type not implemented yet</div>;
    }
  };

  return (
    <div className="p-6">
      <Button
        variant="outline"
        className="mb-4"
        onClick={onClose}
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Reports
      </Button>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        renderReport()
      )}
    </div>
  );
} 