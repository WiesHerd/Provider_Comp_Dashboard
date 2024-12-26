import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    let data: any[] = [];
    let filename = '';
    
    if (type === 'provider') {
      data = [
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
      filename = 'Provider_Template.xlsx';
    } else if (type === 'wrvu') {
      data = [
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
      filename = 'wRVU_Template.xlsx';
    } else {
      return new NextResponse('Invalid template type', { status: 400 });
    }
    
    // Create worksheet with example data
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Return the Excel file
    return new NextResponse(buf, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return new NextResponse('Error generating template', { status: 500 });
  }
} 