import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { generateProviderTemplate } from '@/utils/templates';

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = await params;
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
      case 'market':
        // Create workbook with market data template
        workbook = XLSX.utils.book_new();
        const marketData = [
          {
            'specialty': 'General',
            'p25_TCC': 229801,
            'p50_TCC': 273979,
            'p75_TCC': 330178,
            'p90_TCC': 403435,
            'p25_wrvu': 4451,
            'p50_wrvu': 5786,
            'p75_wrvu': 6945,
            'p90_wrvu': 8328,
            'p25_cf': 43.4,
            'p50_cf': 49.4,
            'p75_cf': 60.1,
            'p90_cf': 77.7
          }
        ];
        const ws = XLSX.utils.json_to_sheet(marketData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Template');
        filename = 'Market_Data_Template.xlsx';
        break;
      case 'provider':
        // Create workbook with provider template data
        workbook = XLSX.utils.book_new();
        const providerData = [
          {
            'employee_id': 'EMP1001',
            'first_name': 'Michael',
            'last_name': 'Johnson',
            'email': 'michael.johnson@healthsystem.org',
            'specialty': 'Dermatology',
            'department': 'Dermatology',
            'hire_date': '9/18/2016',
            'fte': 1,
            'base_salary': 327560,
            'compensation_model': 'Standard'
          }
        ];
        const providerWs = XLSX.utils.json_to_sheet(providerData);
        XLSX.utils.book_append_sheet(workbook, providerWs, 'Template');
        filename = 'Provider_Template.xlsx';
        break;
      case 'wrvu':
        // Create workbook with wRVU template data
        workbook = XLSX.utils.book_new();
        const wrvuData = [
          {
            'employee_id': 'EMP1001',
            'first_name': 'Michael',
            'last_name': 'Johnson',
            'specialty': 'Dermatology',
            'Jan': 193.45,
            'Feb': 474.59,
            'Mar': 232.12,
            'Apr': 646.21,
            'May': 222.48,
            'Jun': 203.69,
            'Jul': 560.84,
            'Aug': 638.42,
            'Sep': 362.21,
            'Oct': 241.90,
            'Nov': 380.88,
            'Dec': 206.42
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