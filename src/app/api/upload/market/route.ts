import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    console.log('Starting market data upload process');
    const formData = await request.formData();
    const file = formData.get('file');
    const mode = formData.get('mode') as string || 'append';

    if (!file || !(file instanceof File)) {
      console.error('No file found in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // If mode is 'clear', delete all existing market data
    if (mode === 'clear') {
      await prisma.marketData.deleteMany();
      console.log('Cleared all existing market data');
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
    const marketData = rawData.map((row: any) => ({
      specialty: row.specialty,
      p25_total: Number(row.p25_TCC),
      p50_total: Number(row.p50_TCC),
      p75_total: Number(row.p75_TCC),
      p90_total: Number(row.p90_TCC),
      p25_wrvu: Number(row.p25_wrvu),
      p50_wrvu: Number(row.p50_wrvu),
      p75_wrvu: Number(row.p75_wrvu),
      p90_wrvu: Number(row.p90_wrvu),
      p25_cf: Number(row.p25_cf),
      p50_cf: Number(row.p50_cf),
      p75_cf: Number(row.p75_cf),
      p90_cf: Number(row.p90_cf)
    }));

    // Process market data records
    const results = await Promise.all(
      marketData.map(async (data) => {
        try {
          return await prisma.marketData.upsert({
            where: { specialty: data.specialty },
            update: {
              p25_total: data.p25_total,
              p50_total: data.p50_total,
              p75_total: data.p75_total,
              p90_total: data.p90_total,
              p25_wrvu: data.p25_wrvu,
              p50_wrvu: data.p50_wrvu,
              p75_wrvu: data.p75_wrvu,
              p90_wrvu: data.p90_wrvu,
              p25_cf: data.p25_cf,
              p50_cf: data.p50_cf,
              p75_cf: data.p75_cf,
              p90_cf: data.p90_cf,
              updatedAt: new Date()
            },
            create: {
              specialty: data.specialty,
              p25_total: data.p25_total,
              p50_total: data.p50_total,
              p75_total: data.p75_total,
              p90_total: data.p90_total,
              p25_wrvu: data.p25_wrvu,
              p50_wrvu: data.p50_wrvu,
              p75_wrvu: data.p75_wrvu,
              p90_wrvu: data.p90_wrvu,
              p25_cf: data.p25_cf,
              p50_cf: data.p50_cf,
              p75_cf: data.p75_cf,
              p90_cf: data.p90_cf
            }
          });
        } catch (error) {
          console.error(`Error processing specialty ${data.specialty}:`, error);
          return null;
        }
      })
    );

    const successfulUploads = results.filter(result => result !== null);
    console.log('Upload successful:', {
      total: marketData.length,
      successful: successfulUploads.length
    });

    return NextResponse.json({
      message: `Successfully processed ${successfulUploads.length} market data records`,
      count: successfulUploads.length
    });
  } catch (error) {
    console.error('Error uploading market data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 