import { NextResponse } from 'next/server';

// Mock database - Replace with actual database operations
let systemConfig = {
  base_wrvu_rate: '45.00',
  default_holdback: '20',
  target_calculation: 'annual',
  target_adjustment: '10',
  fiscal_year_start: '1',
  payment_schedule: 'quarterly',
  department_grouping: 'specialty',
  department_targets: 'aggregate'
};

export async function GET() {
  try {
    // In a real app, get configuration from database
    return NextResponse.json(systemConfig);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return new NextResponse('Error fetching configuration', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newConfig = await request.json();
    
    // Validate configuration
    if (!newConfig || typeof newConfig !== 'object') {
      return new NextResponse('Invalid configuration data', { status: 400 });
    }

    // Validate specific fields
    if (newConfig.base_wrvu_rate && parseFloat(newConfig.base_wrvu_rate) < 0) {
      return new NextResponse('Base wRVU rate cannot be negative', { status: 400 });
    }

    if (newConfig.default_holdback && 
        (parseFloat(newConfig.default_holdback) < 0 || parseFloat(newConfig.default_holdback) > 100)) {
      return new NextResponse('Holdback percentage must be between 0 and 100', { status: 400 });
    }

    // In a real app, validate each setting and save to database
    systemConfig = { ...systemConfig, ...newConfig };

    return NextResponse.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return new NextResponse('Error saving configuration', { status: 500 });
  }
} 