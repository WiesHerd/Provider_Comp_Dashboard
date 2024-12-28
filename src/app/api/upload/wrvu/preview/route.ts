import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface WRVURecord {
  employee_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  month: string;
  wrvu: number;
  year: number;
}

export async function POST(request: Request) {
  try {
    console.log('Starting wRVU data preview process');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      console.error('No file found in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    let workbook;
    try {
      workbook = XLSX.read(bytes, { type: 'array' });
    } catch (e) {
      console.error('Error reading file:', e);
      return NextResponse.json(
        { error: 'Could not read file. Please ensure it is a valid Excel or CSV file.' },
        { status: 400 }
      );
    }
    
    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON with header mapping
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: 0
    });

    // Transform the data into monthly records
    const monthlyData: WRVURecord[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    rawData.forEach((row: any) => {
      // Validate employee data
      if (!row.employee_id) {
        throw new Error('Missing employee ID in row');
      }

      months.forEach((month) => {
        const wrvuValue = parseFloat(row[month]);
        if (!isNaN(wrvuValue)) {
          monthlyData.push({
            employee_id: row.employee_id,
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            specialty: row.specialty || '',
            month: month,
            year: currentYear,
            wrvu: wrvuValue
          });
        }
      });
    });

    // Validate the data
    if (monthlyData.length === 0) {
      return NextResponse.json(
        { error: 'No valid wRVU data found in file.' },
        { status: 400 }
      );
    }

    // Return preview data (first few records for each unique employee)
    const previewData = monthlyData.slice(0, 50); // Limit preview to first 50 records

    return NextResponse.json({
      message: `Found ${monthlyData.length} wRVU records for ${new Set(monthlyData.map(d => d.employee_id)).size} providers`,
      count: monthlyData.length,
      data: previewData
    });
  } catch (error) {
    console.error('Error previewing wRVU data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to preview wRVU data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 