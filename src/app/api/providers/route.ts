import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validation functions
const validateQueryParams = (params: {
  page: number;
  limit: number;
  minFte: number;
  maxFte: number;
  minSalary: number;
  maxSalary: number;
}) => {
  const errors = [];
  
  if (params.page < 1) errors.push('Page must be greater than 0');
  if (params.limit < 1 || params.limit > 100) errors.push('Limit must be between 1 and 100');
  if (params.minFte < 0 || params.minFte > 1) errors.push('Min FTE must be between 0 and 1');
  if (params.maxFte < 0 || params.maxFte > 1) errors.push('Max FTE must be between 0 and 1');
  if (params.minFte > params.maxFte) errors.push('Min FTE cannot be greater than Max FTE');
  if (params.minSalary < 0) errors.push('Min Salary cannot be negative');
  if (params.minSalary > params.maxSalary) errors.push('Min Salary cannot be greater than Max Salary');

  return errors;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const specialty = searchParams.get('specialty') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const minFte = parseFloat(searchParams.get('minFte') || '0');
    const maxFte = parseFloat(searchParams.get('maxFte') || '1');
    const minSalary = parseFloat(searchParams.get('minSalary') || '0');
    const maxSalary = parseFloat(searchParams.get('maxSalary') || '2000000');
    const showMissingBenchmarks = searchParams.get('showMissingBenchmarks') === 'true';
    const showMissingWRVUs = searchParams.get('showMissingWRVUs') === 'true';
    const showNonClinicalFTE = searchParams.get('showNonClinicalFTE') === 'true';

    // Validate parameters
    const validationErrors = validateQueryParams({
      page,
      limit,
      minFte,
      maxFte,
      minSalary,
      maxSalary
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validationErrors },
        { status: 400 }
      );
    }

    // Build where clause based on filters
    const where: any = {
      fte: {
        gte: minFte,
        lte: maxFte,
      },
      baseSalary: {
        gte: minSalary,
        lte: maxSalary,
      },
    };

    if (specialty) {
      where.specialty = specialty;
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    if (!showNonClinicalFTE) {
      where.clinicalFte = {
        gt: 0
      };
    }

    // Count total matching records
    const [total, providers] = await Promise.all([
      prisma.provider.count({ where }),
      prisma.provider.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          lastName: 'asc'
        },
        include: {
          metrics: {
            where: {
              year: new Date().getFullYear()
            },
            take: 1
          }
        }
      })
    ]).catch(error => {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch providers from database');
    });

    const totalPages = Math.ceil(total / limit);

    // Validate page number against total pages
    if (page > totalPages && total > 0) {
      return NextResponse.json(
        { error: 'Page number exceeds available pages', totalPages },
        { status: 400 }
      );
    }

    // Add derived fields
    const providersWithDerivedFields = providers.map(provider => ({
      ...provider,
      hasBenchmarks: true, // You'll need to implement the actual logic for this
      hasWRVUs: provider.metrics.length > 0
    }));

    // Filter after fetching if needed
    let filteredProviders = providersWithDerivedFields;
    if (showMissingBenchmarks) {
      filteredProviders = filteredProviders.filter(p => !p.hasBenchmarks);
    }
    if (showMissingWRVUs) {
      filteredProviders = filteredProviders.filter(p => !p.hasWRVUs);
    }

    return NextResponse.json({
      providers: filteredProviders,
      total: filteredProviders.length,
      page,
      totalPages: Math.ceil(filteredProviders.length / limit)
    });

  } catch (error) {
    console.error('Error in providers API:', error);
    
    // Determine if it's a known error type
    if (error instanceof Error) {
      if (error.message.includes('database')) {
        return NextResponse.json(
          { error: 'Database error occurred', details: error.message },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  } finally {
    // Ensure database connection is handled properly
    await prisma.$disconnect();
  }
} 