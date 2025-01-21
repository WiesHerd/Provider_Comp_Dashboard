import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params;
    console.log('Fetching WRVU data for employee:', employeeId);

    // Get the provider first to get their ID
    const provider = await prisma.provider.findUnique({
      where: { employeeId },
      select: { id: true }
    });
    
    console.log('Provider lookup result:', provider);

    if (!provider) {
      console.log('Provider not found for employeeId:', employeeId);
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Get current year's WRVU data
    const currentYear = new Date().getFullYear();
    console.log('Fetching WRVU data for year:', currentYear);
    
    const wrvuData = await prisma.wRVUData.findUnique({
      where: {
        providerId_year: {
          providerId: provider.id,
          year: currentYear
        }
      }
    });
    
    console.log('WRVU data lookup result:', wrvuData);

    if (!wrvuData) {
      console.log('No WRVU data found for provider:', provider.id, 'year:', currentYear);
      return NextResponse.json({
        totalWRVUs: 0,
        monthlyData: []
      });
    }

    // Transform data to match WRVUChart props structure
    const monthlyData = [
      { month: 'Jan', actualWRVU: wrvuData.jan, targetWRVU: 290 },
      { month: 'Feb', actualWRVU: wrvuData.feb, targetWRVU: 290 },
      { month: 'Mar', actualWRVU: wrvuData.mar, targetWRVU: 290 },
      { month: 'Apr', actualWRVU: wrvuData.apr, targetWRVU: 290 },
      { month: 'May', actualWRVU: wrvuData.may, targetWRVU: 290 },
      { month: 'Jun', actualWRVU: wrvuData.jun, targetWRVU: 290 },
      { month: 'Jul', actualWRVU: wrvuData.jul, targetWRVU: 290 },
      { month: 'Aug', actualWRVU: wrvuData.aug, targetWRVU: 290 },
      { month: 'Sep', actualWRVU: wrvuData.sep, targetWRVU: 290 },
      { month: 'Oct', actualWRVU: wrvuData.oct, targetWRVU: 290 },
      { month: 'Nov', actualWRVU: wrvuData.nov, targetWRVU: 290 },
      { month: 'Dec', actualWRVU: wrvuData.dec, targetWRVU: 290 }
    ];

    const response = {
      totalWRVUs: monthlyData.reduce((sum, month) => sum + month.actualWRVU, 0),
      monthlyData
    };
    
    console.log('Sending response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Detailed error in WRVU data fetch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WRVU data' },
      { status: 500 }
    );
  }
} 