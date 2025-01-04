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
  fte: string | number;
  base_salary: string | number;
  compensation_model: string;
  clinical_fte: string | number;
  non_clinical_fte: string | number;
  clinical_salary: string | number;
  non_clinical_salary: string | number;
}

export async function POST(request: Request) {
  try {
    console.log('Starting provider preview process');
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
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd',
      defval: ''
    }) as ProviderUploadData[];

    console.log('Raw data from Excel:', data[0]); // Log first row for debugging

    // Validate and transform the data
    const previewData = data.map((item: ProviderUploadData) => {
      // Remove currency symbol and commas from salary fields
      const cleanNumber = (value: string | number) => {
        if (typeof value === 'string') {
          return Number(value.replace(/[$,]/g, ''));
        }
        return Number(value);
      };

      const fte = cleanNumber(item.fte);
      const baseSalary = cleanNumber(item.base_salary);
      const clinicalFte = cleanNumber(item.clinical_fte || '0');
      const nonClinicalFte = cleanNumber(item.non_clinical_fte || '0');
      const clinicalSalary = cleanNumber(item.clinical_salary || '0');
      const nonClinicalSalary = cleanNumber(item.non_clinical_salary || '0');

      const transformed = {
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

      console.log('Transformed data:', transformed); // Log transformed data for debugging
      return transformed;
    });

    return NextResponse.json({
      message: `Found ${data.length} records`,
      count: data.length,
      data: previewData
    });
  } catch (error) {
    console.error('Error previewing providers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to preview providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 