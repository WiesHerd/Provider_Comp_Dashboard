import { NextResponse } from 'next/server';

// Mock database - Replace with actual database operations
let userSettings = {
  email_notifications: true,
  notification_frequency: 'daily',
  theme: 'light',
  default_view: 'monthly',
  date_format: 'MM/DD/YYYY',
  timezone: 'America/New_York',
  two_factor: false,
  session_timeout: '30'
};

export async function GET() {
  try {
    // In a real app, get settings from database for the authenticated user
    return NextResponse.json(userSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new NextResponse('Error fetching settings', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    
    // Validate settings
    if (!newSettings || typeof newSettings !== 'object') {
      return new NextResponse('Invalid settings data', { status: 400 });
    }

    // In a real app, validate each setting and save to database
    userSettings = { ...userSettings, ...newSettings };

    return NextResponse.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return new NextResponse('Error saving settings', { status: 500 });
  }
} 