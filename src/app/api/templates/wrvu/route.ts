import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Sample data with the exact column structure
    const data = [
      {
        employee_id: 'EMP1001',
        first_name: 'Michael',
        last_name: 'Johnson',
        specialty: 'Dermatology',
        Jan: 193.45,
        Feb: 474.59,
        Mar: 232.12,
        Apr: 646.21,
        May: 222.48,
        Jun: 203.69,
        Jul: 560.84,
        Aug: 638.42,
        Sep: 362.21,
        Oct: 241.90,
        Nov: 380.88,
        Dec: 206.42
      }
    ];

    // Create worksheet with the data
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    ws['!cols'] = [
      { width: 12 },  // employee_id
      { width: 15 },  // first_name
      { width: 15 },  // last_name
      { width: 25 },  // specialty
      { width: 10 },  // Jan
      { width: 10 },  // Feb
      { width: 10 },  // Mar
      { width: 10 },  // Apr
      { width: 10 },  // May
      { width: 10 },  // Jun
      { width: 10 },  // Jul
      { width: 10 },  // Aug
      { width: 10 },  // Sep
      { width: 10 },  // Oct
      { width: 10 },  // Nov
      { width: 10 }   // Dec
    ];

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'wRVU Data Template');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return the file
    return new NextResponse(buf, {
      headers: {
        'Content-Disposition': 'attachment; filename="wrvu_data_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (error) {
    console.error('Error generating wRVU template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
} 