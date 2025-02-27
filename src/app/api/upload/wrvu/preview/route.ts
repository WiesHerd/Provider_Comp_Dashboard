import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
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
    
    // Define header mapping
    const headerMapping = {
      'employee_id': 'employee_id',
      'first_name': 'first_name',
      'last_name': 'last_name',
      'specialty': 'specialty',
      'year': 'year',
      'Jan': 'Jan',
      'Feb': 'Feb',
      'Mar': 'Mar',
      'Apr': 'Apr',
      'May': 'May',
      'Jun': 'Jun',
      'Jul': 'Jul',
      'Aug': 'Aug',
      'Sep': 'Sep',
      'Oct': 'Oct',
      'Nov': 'Nov',
      'Dec': 'Dec'
    };
    
    // Convert to JSON with header mapping
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: 0,  // Default value for empty cells
      blankrows: false,  // Skip blank rows
      header: 1  // Use first row as headers
    });

    // Skip the header row and map the data
    const mappedData = (rawData as any[]).slice(1).map(row => {
      const mappedRow: any = {};
      // Map the columns based on their position in the CSV
      mappedRow.employee_id = row[0];
      mappedRow.first_name = row[1];
      mappedRow.last_name = row[2];
      mappedRow.specialty = row[3];
      mappedRow.year = row[4];
      mappedRow.Jan = row[5];
      mappedRow.Feb = row[6];
      mappedRow.Mar = row[7];
      mappedRow.Apr = row[8];
      mappedRow.May = row[9];
      mappedRow.Jun = row[10];
      mappedRow.Jul = row[11];
      mappedRow.Aug = row[12];
      mappedRow.Sep = row[13];
      mappedRow.Oct = row[14];
      mappedRow.Nov = row[15];
      mappedRow.Dec = row[16];
      return mappedRow;
    });

    // Return the first 5 rows for preview
    const previewData = mappedData.slice(0, 5);

    console.log('Preview data:', previewData); // Debug log

    return NextResponse.json({
      data: previewData,
      totalRows: mappedData.length
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