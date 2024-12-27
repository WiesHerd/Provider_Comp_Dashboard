import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface MarketDataUpload {
  specialty: string;
  p25_TCC: number;
  p50_TCC: number;
  p75_TCC: number;
  p90_TCC: number;
  p25_wrvu: number;
  p50_wrvu: number;
  p75_wrvu: number;
  p90_wrvu: number;
  p25_cf: number;
  p50_cf: number;
  p75_cf: number;
  p90_cf: number;
}

export async function POST(request: Request) {
  try {
    console.log('Starting market data preview process');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      console.error('No file found in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Read file content
    const bytes = await file.arrayBuffer();
    console.log('File buffer size:', bytes.byteLength);
    
    let workbook;
    try {
      workbook = XLSX.read(bytes, { type: 'array' });
      console.log('Workbook sheets:', workbook.SheetNames);
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

    // Transform the data to match our interface
    const data = rawData.map((row: any) => ({
      specialty: row.specialty || '',
      p25_total: Number(row.p25_TCC) || 0,
      p50_total: Number(row.p50_TCC) || 0,
      p75_total: Number(row.p75_TCC) || 0,
      p90_total: Number(row.p90_TCC) || 0,
      p25_wrvu: Number(row.p25_wrvu) || 0,
      p50_wrvu: Number(row.p50_wrvu) || 0,
      p75_wrvu: Number(row.p75_wrvu) || 0,
      p90_wrvu: Number(row.p90_wrvu) || 0,
      p25_cf: Number(row.p25_cf) || 0,
      p50_cf: Number(row.p50_cf) || 0,
      p75_cf: Number(row.p75_cf) || 0,
      p90_cf: Number(row.p90_cf) || 0
    }));

    // Validate the data
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No market data found in file.' },
        { status: 400 }
      );
    }

    // Validate each record
    const errors: string[] = [];
    data.forEach((item, index) => {
      if (!item.specialty) {
        errors.push(`Row ${index + 1}: Missing specialty`);
      }
      if (Object.values(item).some(val => val === undefined)) {
        errors.push(`Row ${index + 1}: Missing required fields`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Found ${data.length} records`,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Error previewing market data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to preview market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 