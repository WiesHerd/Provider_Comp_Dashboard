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
  fte: string;
  base_salary: string;
  compensation_model: string;
  clinical_fte: string;
  non_clinical_fte: string;
  clinical_salary: string;
  non_clinical_salary: string;
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

    // Read file content
    const bytes = await file.arrayBuffer();
    
    let workbook;
    try {
      workbook = XLSX.read(bytes, { type: 'array' });
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
      const baseSalary = Number(item.base_salary);
      const clinicalFte = Number(item.clinical_fte || '0');
      const nonClinicalFte = Number(item.non_clinical_fte || '0');
      const clinicalSalary = Number(item.clinical_salary || '0');
      const nonClinicalSalary = Number(item.non_clinical_salary || '0');

      return {
        employeeId: item.employee_id,
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        specialty: item.specialty,
        department: item.department,
        hireDate: item.hire_date,
        fte: isNaN(fte) ? 0 : fte,
        baseSalary: isNaN(baseSalary) ? 0 : baseSalary,
        compensationModel: item.compensation_model || 'Standard',
        clinicalFte: isNaN(clinicalFte) ? 0 : clinicalFte,
        nonClinicalFte: isNaN(nonClinicalFte) ? 0 : nonClinicalFte,
        clinicalSalary: isNaN(clinicalSalary) ? 0 : clinicalSalary,
        nonClinicalSalary: isNaN(nonClinicalSalary) ? 0 : nonClinicalSalary
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