import { utils, WorkBook } from 'xlsx';

// Constants for validation
const SPECIALTIES = [
  'Cardiology',
  'Internal Medicine',
  'Family Medicine',
  'Orthopedics',
  'Pediatrics',
  'Emergency Medicine',
  'Oncology',
  'Neurology',
  'Psychiatry',
  'General Surgery'
];

const PROVIDER_TYPES = ['MD', 'DO', 'NP', 'PA'];

const PAYOUT_FREQUENCIES = ['Monthly', 'Quarterly', 'Bi-Annual', 'Annual'];

const COMPENSATION_TYPES = ['Base Only', 'Single CF', 'Tiered CF', 'Custom Target'];

// Base interfaces
interface BaseProvider {
  employeeId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  providerType: string;
  fte: number;
  department: string;
  hireDate: string;
  email: string;
  phone: string;
  npi: string;
}

interface CompensationModel {
  employeeId: string;
  compensationType: typeof COMPENSATION_TYPES[number];
  baseSalary: number;
  baseConversionFactor?: number;  // Not used for Base Only
  defaultTarget?: number;         // Used for Custom Target
  payoutFrequency: typeof PAYOUT_FREQUENCIES[number];
  effectiveDate: string;
  endDate?: string;
  holdbackPercentage?: number;    // Optional holdback for any model
}

interface TieredCF {
  employeeId: string;
  percentileThreshold: number;    // e.g., 60 for 60th percentile
  conversionFactor: number;
  effectiveDate: string;
  endDate?: string;
}

interface CustomTarget {
  employeeId: string;
  period: string;        // YYYY-MM for monthly, YYYY-Q# for quarterly, etc.
  target: number;
  reason?: string;
}

// Example data
const providerExamples: BaseProvider[] = [
  {
    employeeId: 'EMP1001',
    firstName: 'John',
    lastName: 'Smith',
    specialty: 'Internal Medicine',
    providerType: 'MD',
    fte: 1.0,
    department: 'Main Hospital',
    hireDate: '2023-01-01',
    email: 'john.smith@hospital.com',
    phone: '555-123-4567',
    npi: '1234567890'
  }
];

const compensationExamples: CompensationModel[] = [
  {
    employeeId: 'EMP1001',
    compensationType: 'Single CF',
    baseSalary: 245055,
    baseConversionFactor: 47.9,
    payoutFrequency: 'Monthly',
    effectiveDate: '2023-01-01',
    holdbackPercentage: 10
  },
  {
    employeeId: 'EMP1002',
    compensationType: 'Tiered CF',
    baseSalary: 286364,
    baseConversionFactor: 45.0,
    payoutFrequency: 'Quarterly',
    effectiveDate: '2023-01-01',
    holdbackPercentage: 15
  },
  {
    employeeId: 'EMP1003',
    compensationType: 'Base Only',
    baseSalary: 200000,
    payoutFrequency: 'Annual',
    effectiveDate: '2023-01-01'
  },
  {
    employeeId: 'EMP1004',
    compensationType: 'Custom Target',
    baseSalary: 180000,
    defaultTarget: 4000,
    payoutFrequency: 'Monthly',
    effectiveDate: '2023-01-01',
    holdbackPercentage: 20
  }
];

const tieredCFExamples: TieredCF[] = [
  {
    employeeId: 'EMP1002',
    percentileThreshold: 0,
    conversionFactor: 45.0,
    effectiveDate: '2023-01-01'
  },
  {
    employeeId: 'EMP1002',
    percentileThreshold: 60,
    conversionFactor: 47.5,
    effectiveDate: '2023-01-01'
  },
  {
    employeeId: 'EMP1002',
    percentileThreshold: 75,
    conversionFactor: 50.0,
    effectiveDate: '2023-01-01'
  }
];

const customTargetExamples: CustomTarget[] = [
  {
    employeeId: 'EMP1004',
    period: '2024-01',
    target: 300,
    reason: 'Ramp-up period'
  },
  {
    employeeId: 'EMP1004',
    period: '2024-Q1',
    target: 1200,
    reason: 'Quarterly target adjusted for market conditions'
  }
];

export function generateProviderTemplate(): WorkBook {
  const workbook = utils.book_new();

  // Sheet 1: Provider Information
  const providerSheet = utils.json_to_sheet(providerExamples);
  utils.book_append_sheet(workbook, providerSheet, 'Providers');
  utils.sheet_add_aoa(providerSheet, [
    [
      'Employee ID*',
      'First Name*',
      'Last Name*',
      'Specialty*',
      'Provider Type*',
      'FTE*',
      'Department*',
      'Hire Date*',
      'Email*',
      'Phone*',
      'NPI*'
    ]
  ], { origin: 'A1' });

  // Sheet 2: Compensation Models
  const compensationSheet = utils.json_to_sheet(compensationExamples);
  utils.book_append_sheet(workbook, compensationSheet, 'Compensation');
  utils.sheet_add_aoa(compensationSheet, [
    [
      'Employee ID*',
      'Compensation Type*',
      'Base Salary*',
      'Base CF',
      'Default Target',
      'Payout Frequency*',
      'Effective Date*',
      'End Date',
      'Holdback %'
    ]
  ], { origin: 'A1' });

  // Sheet 3: Tiered CFs
  const tieredSheet = utils.json_to_sheet(tieredCFExamples);
  utils.book_append_sheet(workbook, tieredSheet, 'Tiered CFs');
  utils.sheet_add_aoa(tieredSheet, [
    [
      'Employee ID*',
      'Percentile Threshold*',
      'Conversion Factor*',
      'Effective Date*',
      'End Date'
    ]
  ], { origin: 'A1' });

  // Sheet 4: Custom Targets
  const targetSheet = utils.json_to_sheet(customTargetExamples);
  utils.book_append_sheet(workbook, targetSheet, 'Custom Targets');
  utils.sheet_add_aoa(targetSheet, [
    [
      'Employee ID*',
      'Period*',
      'Target*',
      'Reason'
    ]
  ], { origin: 'A1' });

  // Add validations
  addProviderValidations(providerSheet);
  addCompensationValidations(compensationSheet);
  addTieredValidations(tieredSheet);
  addTargetValidations(targetSheet);

  return workbook;
}

function addProviderValidations(sheet: any) {
  sheet['!dataValidation'] = {
    D2: { // Specialty
      type: 'list',
      operator: 'equal',
      formula1: SPECIALTIES.join(','),
      error: 'Please select a valid specialty',
      showErrorMessage: true
    },
    E2: { // Provider Type
      type: 'list',
      operator: 'equal',
      formula1: PROVIDER_TYPES.join(','),
      error: 'Please select a valid provider type',
      showErrorMessage: true
    },
    F2: { // FTE
      type: 'decimal',
      operator: 'between',
      formula1: '0',
      formula2: '1',
      error: 'FTE must be between 0 and 1',
      showErrorMessage: true
    }
  };
}

function addCompensationValidations(sheet: any) {
  sheet['!dataValidation'] = {
    B2: { // Compensation Type
      type: 'list',
      operator: 'equal',
      formula1: COMPENSATION_TYPES.join(','),
      error: 'Please select a valid compensation type',
      showErrorMessage: true
    },
    C2: { // Base Salary
      type: 'decimal',
      operator: 'greaterThan',
      formula1: '0',
      error: 'Base salary must be greater than 0',
      showErrorMessage: true
    },
    F2: { // Payout Frequency
      type: 'list',
      operator: 'equal',
      formula1: PAYOUT_FREQUENCIES.join(','),
      error: 'Please select a valid payout frequency',
      showErrorMessage: true
    },
    I2: { // Holdback
      type: 'decimal',
      operator: 'between',
      formula1: '0',
      formula2: '100',
      error: 'Holdback must be between 0 and 100',
      showErrorMessage: true
    }
  };
}

function addTieredValidations(sheet: any) {
  sheet['!dataValidation'] = {
    B2: { // Percentile Threshold
      type: 'decimal',
      operator: 'between',
      formula1: '0',
      formula2: '100',
      error: 'Percentile threshold must be between 0 and 100',
      showErrorMessage: true
    },
    C2: { // CF
      type: 'decimal',
      operator: 'greaterThan',
      formula1: '0',
      error: 'Conversion factor must be greater than 0',
      showErrorMessage: true
    }
  };
}

function addTargetValidations(sheet: any) {
  sheet['!dataValidation'] = {
    B2: { // Period
      type: 'custom',
      operator: 'equal',
      formula1: '^(\\d{4}-\\d{2}|\\d{4}-Q[1-4])$',
      error: 'Period must be in YYYY-MM or YYYY-Q# format',
      showErrorMessage: true
    },
    C2: { // Target
      type: 'decimal',
      operator: 'greaterThanOrEqual',
      formula1: '0',
      error: 'Target must be greater than or equal to 0',
      showErrorMessage: true
    }
  };
} 