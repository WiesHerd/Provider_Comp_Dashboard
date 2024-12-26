import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { generateProviderTemplate } from '@/utils/templates';

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;
    let workbook;
    let filename;

    switch (type) {
      case 'provider-upload':
        workbook = generateProviderTemplate();
        filename = 'Provider_Upload_Template.xlsx';
        break;
      case 'wrvu-upload':
        workbook = generateProviderTemplate(); // TODO: Replace with actual wRVU template
        filename = 'wRVU_Upload_Template.xlsx';
        break;
      case 'market-data':
        workbook = generateProviderTemplate(); // TODO: Replace with actual market data template
        filename = 'Market_Data_Template.xlsx';
        break;
      case 'provider':
        // Create workbook with provider template data
        workbook = XLSX.utils.book_new();
        const providerData = [
          {
            'First Name': 'John',
            'Last Name': 'Smith',
            'Employee ID': 'EMP1001',
            'Specialty': 'Cardiology',
            'Provider Type': 'MD',
            'FTE': 0.8,
            'Annual Base Salary': 220000,
            'wRVU Conversion Factor': 45.00,
            'Annual wRVU Target': 4800,
            'Hire Date': '2023-01-01',
            'Incentive Type': 'Quarterly',
            'Holdback Percentage': 20
          }
        ];
        const ws = XLSX.utils.json_to_sheet(providerData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Template');
        filename = 'Provider_Template.xlsx';
        break;
      case 'wrvu':
        // Create workbook with wRVU template data
        workbook = XLSX.utils.book_new();
        const wrvuData = [
          {
            'Employee ID': 'EMP1001',
            'Month': '2024-01',
            'Actual wRVUs': 400.00,
            'Target wRVUs': 375.70,
            'Adjustment Type': 'Bonus',
            'Adjustment Amount': 50.00,
            'Adjustment Notes': 'Additional coverage'
          }
        ];
        const wrvuWs = XLSX.utils.json_to_sheet(wrvuData);
        XLSX.utils.book_append_sheet(workbook, wrvuWs, 'Template');
        filename = 'wRVU_Template.xlsx';
        break;
      default:
        return new NextResponse('Template not found', { status: 404 });
    }

    // Convert workbook to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return new NextResponse('Error generating template', { status: 500 });
  }
} 