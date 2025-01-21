import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const monthToNumber: { [key: string]: number } = {
  'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
  'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;

    const analytics = await prisma.providerAnalytics.findMany({
      where: {
        year,
        month
      },
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
            clinicalFte: true
          }
        }
      }
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching provider analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Convert string month to number if needed
    const month = typeof data.month === 'string' ? monthToNumber[data.month.toLowerCase()] : data.month;
    
    if (!month) {
      throw new Error('Invalid month provided');
    }

    // Ensure all numeric fields are properly typed
    const analytics = await prisma.providerAnalytics.upsert({
      where: {
        providerId_year_month: {
          providerId: data.providerId,
          year: data.year,
          month: month
        }
      },
      update: {
        ytdProgress: Number(data.ytdProgress) || 0,
        ytdTargetProgress: Number(data.ytdTargetProgress) || 0,
        incentivePercentage: Number(data.incentivePercentage) || 0,
        clinicalUtilization: Number(data.clinicalUtilization) || 0
      },
      create: {
        providerId: data.providerId,
        year: data.year,
        month: month,
        ytdProgress: Number(data.ytdProgress) || 0,
        ytdTargetProgress: Number(data.ytdTargetProgress) || 0,
        incentivePercentage: Number(data.incentivePercentage) || 0,
        clinicalUtilization: Number(data.clinicalUtilization) || 0
      }
    });

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error storing provider analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store provider analytics' },
      { status: 500 }
    );
  }
} 