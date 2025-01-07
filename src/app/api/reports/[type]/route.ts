import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ReportParams {
  timeframe: string;
  department: string;
  reportType: string;
  subType: string;
}

const formatWRVU = (value: number) => {
  if (value === null || value === undefined || value === 0) return '-';
  return value.toFixed(1);
};

const getMonthName = (month: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
};

async function generateReport(params: ReportParams) {
  const { timeframe, department, reportType, subType } = params;
  let data: any[] = [];
  let filename = '';

  switch (reportType) {
    case 'performance':
      data = await generatePerformanceReport(subType, timeframe, department);
      filename = `Provider_Performance_${subType}_${timeframe}.xlsx`;
      break;
    case 'compensation':
      data = await generateCompensationReport(subType, timeframe, department);
      filename = `Compensation_${subType}_${timeframe}.xlsx`;
      break;
    case 'department':
      data = await generateDepartmentReport(subType, timeframe, department);
      filename = `Department_Analytics_${subType}_${timeframe}.xlsx`;
      break;
    case 'productivity':
      data = await generateProductivityReport(subType, timeframe, department);
      filename = `Productivity_${subType}_${timeframe}.xlsx`;
      break;
    case 'variance':
      data = await generateVarianceReport(subType, timeframe, department);
      filename = `Variance_${subType}_${timeframe}.xlsx`;
      break;
    default:
      throw new Error('Invalid report type');
  }

  return { data, filename };
}

async function generatePerformanceReport(subType: string, timeframe: string, department: string) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Get all providers with their metrics and wRVU data
  const providers = await prisma.provider.findMany({
    where: {
      status: 'Active',
      ...(department !== 'all' && { department })
    },
    include: {
      metrics: {
        where: {
          year: currentYear,
          month: currentMonth
        }
      },
      wrvuData: {
        where: {
          year: currentYear,
          month: currentMonth
        }
      },
      targetAdjustments: {
        where: {
          year: currentYear,
          month: currentMonth
        }
      }
    }
  });

  switch (subType) {
    case 'monthly':
      return providers.map(provider => {
        const metrics = provider.metrics[0];
        const wrvuData = provider.wrvuData[0];
        const targetAdjustments = provider.targetAdjustments.reduce((sum, adj) => sum + adj.value, 0);

        const actualWRVUs = metrics?.actualWRVUs || wrvuData?.value || 0;
        const targetWRVUs = (metrics?.targetWRVUs || provider.targetWRVUs || 0) + targetAdjustments;

        return {
          'Provider Name': `${provider.firstName} ${provider.lastName}`,
          'Department': provider.department,
          'Specialty': provider.specialty,
          'Actual wRVUs': actualWRVUs,
          'Target wRVUs': targetWRVUs,
          'Achievement %': targetWRVUs > 0 ? ((actualWRVUs / targetWRVUs) * 100).toFixed(1) + '%' : '-',
          'Month': getMonthName(currentMonth),
          'Year': currentYear
        };
      });
    case 'quarterly':
      // Implement quarterly aggregation here
      return [];
    default:
      return providers;
  }
}

async function generateCompensationReport(subType: string, timeframe: string, department: string) {
  // Implementation for compensation reports
  return [];
}

async function generateDepartmentReport(subType: string, timeframe: string, department: string) {
  // Implementation for department reports
  return [];
}

async function generateProductivityReport(subType: string, timeframe: string, department: string) {
  // Implementation for productivity reports
  return [];
}

async function generateVarianceReport(subType: string, timeframe: string, department: string) {
  // Implementation for variance reports
  return [];
}

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';
    const department = searchParams.get('department') || 'all';
    const subType = searchParams.get('subType') || '';
    
    const { data, filename } = await generateReport({
      timeframe,
      department,
      reportType: params.type,
      subType
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return new NextResponse('Error generating report', { status: 500 });
  }
} 