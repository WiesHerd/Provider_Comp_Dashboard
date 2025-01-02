import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    console.log('Fetching wRVU data for year:', currentYear);
    
    const providers = await prisma.provider.findMany({
      include: {
        wrvuData: {
          where: {
            year: currentYear
          }
        }
      }
    });
    
    console.log('Raw providers data:', JSON.stringify(providers, null, 2));
    
    // Transform the data to match the expected format, one entry per provider
    const formattedData = providers.map(provider => {
      console.log(`Processing provider ${provider.id}:`, provider);
      // Create a map of month -> value from the wRVU data
      const monthlyValues = provider.wrvuData.reduce((acc, data) => {
        acc[data.month] = data.value;
        return acc;
      }, {} as Record<number, number>);
      
      return {
        id: provider.id,
        employee_id: provider.employeeId,
        first_name: provider.firstName,
        last_name: provider.lastName,
        specialty: provider.specialty,
        year: currentYear,
        jan: monthlyValues[1] || 0,
        feb: monthlyValues[2] || 0,
        mar: monthlyValues[3] || 0,
        apr: monthlyValues[4] || 0,
        may: monthlyValues[5] || 0,
        jun: monthlyValues[6] || 0,
        jul: monthlyValues[7] || 0,
        aug: monthlyValues[8] || 0,
        sep: monthlyValues[9] || 0,
        oct: monthlyValues[10] || 0,
        nov: monthlyValues[11] || 0,
        dec: monthlyValues[12] || 0
      };
    });
    
    console.log('Formatted data being returned:', formattedData);
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wRVU data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const currentYear = new Date().getFullYear();

    // First, ensure the provider exists
    const provider = await prisma.provider.findUnique({
      where: {
        employeeId: data.employee_id
      }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Create wRVU data for each month
    const monthlyData = {
      1: data.jan || 0,
      2: data.feb || 0,
      3: data.mar || 0,
      4: data.apr || 0,
      5: data.may || 0,
      6: data.jun || 0,
      7: data.jul || 0,
      8: data.aug || 0,
      9: data.sep || 0,
      10: data.oct || 0,
      11: data.nov || 0,
      12: data.dec || 0
    };

    // Create all monthly records
    const wrvuData = await Promise.all(
      Object.entries(monthlyData).map(([month, value]) =>
        prisma.wRVUData.upsert({
          where: {
            providerId_year_month: {
              providerId: provider.id,
              year: currentYear,
              month: parseInt(month)
            }
          },
          create: {
            year: currentYear,
            month: parseInt(month),
            value,
            hours: 160,
            providerId: provider.id
          },
          update: {
            value,
            hours: 160
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: wrvuData.length });
  } catch (error) {
    console.error('Error creating wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to create wRVU data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const currentYear = new Date().getFullYear();

    // Find the provider
    const provider = await prisma.provider.findUnique({
      where: {
        employeeId: data.employee_id
      }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Update wRVU data for each month
    const monthlyData = {
      1: data.jan || 0,
      2: data.feb || 0,
      3: data.mar || 0,
      4: data.apr || 0,
      5: data.may || 0,
      6: data.jun || 0,
      7: data.jul || 0,
      8: data.aug || 0,
      9: data.sep || 0,
      10: data.oct || 0,
      11: data.nov || 0,
      12: data.dec || 0
    };

    // Update all monthly records
    const wrvuData = await Promise.all(
      Object.entries(monthlyData).map(([month, value]) =>
        prisma.wRVUData.upsert({
          where: {
            providerId_year_month: {
              providerId: provider.id,
              year: currentYear,
              month: parseInt(month)
            }
          },
          update: {
            value,
            hours: 160
          },
          create: {
            year: currentYear,
            month: parseInt(month),
            value,
            hours: 160,
            providerId: provider.id
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: wrvuData.length });
  } catch (error) {
    console.error('Error updating wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to update wRVU data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be an array' },
        { status: 400 }
      );
    }

    // Delete wRVU data for the specified providers
    await prisma.wRVUData.deleteMany({
      where: {
        providerId: {
          in: ids
        }
      }
    });

    return NextResponse.json({ message: 'Records deleted successfully' });
  } catch (error) {
    console.error('Error deleting wRVU data:', error);
    return NextResponse.json(
      { error: 'Failed to delete wRVU data' },
      { status: 500 }
    );
  }
} 