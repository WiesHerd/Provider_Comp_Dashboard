import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

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
      raw: false,
      defval: '0'
    });

    // Transform and validate the data
    const wrvuData = rawData.map((row: any) => ({
      employeeId: row.employee_id,
      firstName: row.first_name,
      lastName: row.last_name,
      specialty: row.specialty,
      jan: Number(row.Jan) || 0,
      feb: Number(row.Feb) || 0,
      mar: Number(row.Mar) || 0,
      apr: Number(row.Apr) || 0,
      may: Number(row.May) || 0,
      jun: Number(row.Jun) || 0,
      jul: Number(row.Jul) || 0,
      aug: Number(row.Aug) || 0,
      sep: Number(row.Sep) || 0,
      oct: Number(row.Oct) || 0,
      nov: Number(row.Nov) || 0,
      dec: Number(row.Dec) || 0
    }));

    // Return preview data (first 5 records)
    const previewData = wrvuData.slice(0, 5);
    const totalRecords = wrvuData.length;

    return NextResponse.json({
      data: wrvuData,
      message: `Found ${totalRecords} records in the file`
    });
  } catch (error) {
    console.error('Error generating wRVU data preview:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 