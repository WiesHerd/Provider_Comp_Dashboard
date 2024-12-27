import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface WRVUUploadData {
  employee_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export async function POST(request: Request) {
  try {
    console.log('Starting wRVU data upload process');
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

    const currentYear = new Date().getFullYear();

    // Process wRVU data records
    const results = await Promise.all(
      wrvuData.map(async (data) => {
        try {
          // First find the provider
          const provider = await prisma.provider.findUnique({
            where: { employeeId: data.employeeId }
          });

          if (!provider) {
            throw new Error(`Provider not found with ID: ${data.employeeId}`);
          }

          // Then upsert the wRVU data
          return await prisma.wRVUData.upsert({
            where: {
              providerId_year: {
                providerId: provider.id,
                year: currentYear
              }
            },
            update: {
              jan: data.jan,
              feb: data.feb,
              mar: data.mar,
              apr: data.apr,
              may: data.may,
              jun: data.jun,
              jul: data.jul,
              aug: data.aug,
              sep: data.sep,
              oct: data.oct,
              nov: data.nov,
              dec: data.dec,
              updatedAt: new Date()
            },
            create: {
              providerId: provider.id,
              year: currentYear,
              jan: data.jan,
              feb: data.feb,
              mar: data.mar,
              apr: data.apr,
              may: data.may,
              jun: data.jun,
              jul: data.jul,
              aug: data.aug,
              sep: data.sep,
              oct: data.oct,
              nov: data.nov,
              dec: data.dec
            }
          });
        } catch (error) {
          console.error(`Error processing wRVU data for employee ${data.employeeId}:`, error);
          return null;
        }
      })
    );

    const successfulUploads = results.filter(result => result !== null);
    console.log('Upload successful:', {
      total: wrvuData.length,
      successful: successfulUploads.length
    });

    return NextResponse.json({
      message: `Successfully processed ${successfulUploads.length} wRVU records`,
      count: successfulUploads.length
    });
  } catch (error) {
    console.error('Error uploading wRVU data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload wRVU data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 