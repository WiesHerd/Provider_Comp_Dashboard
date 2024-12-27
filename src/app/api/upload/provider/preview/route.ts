import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface ProviderUploadData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  department: string;
  hire_date: string;
  fte: number;
  base_salary: number;
  compensation_model: string;
}

export async function POST(request: Request) {
  try {
    console.log('Starting provider preview process');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      console.error('No file found in request');
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
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
      return new Response(
        JSON.stringify({ error: 'Could not read file. Please ensure it is a valid Excel or CSV file.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON with header mapping
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd',
      defval: ''
    }) as ProviderUploadData[];

    // Validate and transform the data
    const previewData = data.map((item: ProviderUploadData) => {
      const fte = Number(item.fte);
      const salary = Number(item.base_salary);

      return {
        employeeId: item.employee_id,
        firstName: item.first_name,
        lastName: item.last_name,
        specialty: item.specialty,
        department: item.department,
        fte: isNaN(fte) ? 0 : fte,
        baseSalary: isNaN(salary) ? 0 : salary,
        compensationModel: item.compensation_model || 'Standard'
      };
    });

    return new Response(
      JSON.stringify({
        message: `Found ${data.length} records`,
        count: data.length,
        data: previewData
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error previewing providers:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to preview providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 