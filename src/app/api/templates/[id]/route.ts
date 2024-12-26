import { NextResponse } from 'next/server';
import { write, utils } from 'xlsx';
import { 
  generateProviderTemplate, 
  generateWRVUTemplate, 
  generateMarketDataTemplate 
} from '@/utils/templates';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let workbook;
    let filename;

    switch (params.id) {
      case 'provider-upload':
        workbook = generateProviderTemplate();
        filename = 'Provider_Upload_Template.xlsx';
        break;
      case 'wrvu-upload':
        workbook = generateWRVUTemplate();
        filename = 'wRVU_Upload_Template.xlsx';
        break;
      case 'market-data':
        workbook = generateMarketDataTemplate();
        filename = 'Market_Data_Template.xlsx';
        break;
      default:
        return new NextResponse('Template not found', { status: 404 });
    }

    // Convert workbook to buffer
    const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return new NextResponse('Error generating template', { status: 500 });
  }
} 