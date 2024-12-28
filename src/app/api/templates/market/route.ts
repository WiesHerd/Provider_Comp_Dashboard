import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Sample data with the exact column structure
    const data = [
      {
        specialty: 'General',
        p25_TCC: 229801,
        p50_TCC: 273979,
        p75_TCC: 330178,
        p90_TCC: 403435,
        p25_wrvu: 4451,
        p50_wrvu: 5786,
        p75_wrvu: 6945,
        p90_wrvu: 8328,
        p25_cf: 43.4,
        p50_cf: 49.4,
        p75_cf: 60.1,
        p90_cf: 77.7
      }
    ];

    // Create worksheet with the data
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    ws['!cols'] = [
      { width: 30 },  // specialty
      { width: 15 },  // p25_TCC
      { width: 15 },  // p50_TCC
      { width: 15 },  // p75_TCC
      { width: 15 },  // p90_TCC
      { width: 15 },  // p25_wrvu
      { width: 15 },  // p50_wrvu
      { width: 15 },  // p75_wrvu
      { width: 15 },  // p90_wrvu
      { width: 15 },  // p25_cf
      { width: 15 },  // p50_cf
      { width: 15 },  // p75_cf
      { width: 15 }   // p90_cf
    ];

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Market Data Template');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return the file
    return new NextResponse(buf, {
      headers: {
        'Content-Disposition': 'attachment; filename="market_data_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (error) {
    console.error('Error generating market data template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
} 