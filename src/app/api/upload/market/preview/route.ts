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
      raw: true,
      defval: 0
    });

    // Transform the data to match our interface
    const data = rawData.map((row: any) => {
      // Helper function to parse numeric values
      const parseNumeric = (value: any) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Remove any currency symbols and commas
          const cleaned = value.replace(/[$,]/g, '');
          return Number(cleaned) || 0;
        }
        return 0;
      };

      return {
        specialty: row.specialty || '',
        p25_TCC: parseNumeric(row.p25_TCC),
        p50_TCC: parseNumeric(row.p50_TCC),
        p75_TCC: parseNumeric(row.p75_TCC),
        p90_TCC: parseNumeric(row.p90_TCC),
        p25_wrvu: parseNumeric(row.p25_wrvu),
        p50_wrvu: parseNumeric(row.p50_wrvu),
        p75_wrvu: parseNumeric(row.p75_wrvu),
        p90_wrvu: parseNumeric(row.p90_wrvu),
        p25_cf: parseNumeric(row.p25_cf),
        p50_cf: parseNumeric(row.p50_cf),
        p75_cf: parseNumeric(row.p75_cf),
        p90_cf: parseNumeric(row.p90_cf)
      };
    });

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