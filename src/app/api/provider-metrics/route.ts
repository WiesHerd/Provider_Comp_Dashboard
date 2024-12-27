import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const metrics = await request.json();
    console.log('Received metrics:', metrics);
    
    // Validate required fields
    const requiredFields = [
      'providerId',
      'year',
      'month',
      'actualWRVUs',
      'ytdWRVUs',
      'annualizedWRVUs',
      'monthlyTarget',
      'ytdTarget',
      'wrvuVariance',
      'currentFTE',
      'completedMonths',
      'monthlyCompensation',
      'ytdCompensation',
      'annualizedCompensation',
      'conversionFactor',
      'cfPercentile',
      'wrvuPercentile',
      'compensationPercentile',
      'normalizedWRVUs',
      'compensationModel'
    ];

    for (const field of requiredFields) {
      if (!(field in metrics)) {
        console.error(`Missing required field: ${field}`);
        return new NextResponse(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Set calculation date if not provided
    metrics.calculatedDate = metrics.calculatedDate || new Date();

    console.log('Saving metrics to database...');
    try {
      const saved = await prisma.providerMetrics.upsert({
        where: {
          providerId_year_month: {
            providerId: metrics.providerId,
            year: metrics.year,
            month: metrics.month
          }
        },
        update: metrics,
        create: metrics
      });

      console.log('Metrics saved successfully:', saved);
      return new NextResponse(
        JSON.stringify(saved),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database error',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error saving provider metrics:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to save metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const where: any = { providerId };
    
    if (year) {
      where.year = parseInt(year);
    }
    
    if (month) {
      where.month = parseInt(month);
    }

    const metrics = await prisma.providerMetrics.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching provider metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 