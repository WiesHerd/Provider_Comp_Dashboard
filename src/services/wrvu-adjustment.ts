import { WRVUAdjustment, WRVUAdjustmentFormData, WRVUAdjustmentResponse, MonthlyValues } from '@/types/wrvu-adjustment';

const API_BASE = '/api/wrvu-adjustments';

export async function getWRVUAdjustments(providerId?: string, year?: number): Promise<WRVUAdjustmentResponse> {
  const params = new URLSearchParams();
  if (providerId) params.append('providerId', providerId);
  if (year) params.append('year', year.toString());

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  return response.json();
}

export async function createWRVUAdjustment(data: WRVUAdjustmentFormData): Promise<WRVUAdjustmentResponse> {
  try {
    console.log('Creating wRVU adjustment with data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.name) {
      return {
        success: false,
        error: 'Name is required'
      };
    }
    if (!data.providerId) {
      return {
        success: false,
        error: 'Provider ID is required'
      };
    }
    if (!data.year) {
      return {
        success: false,
        error: 'Year is required'
      };
    }

    // Ensure all monthly values are numbers
    const monthlyValues = Object.entries(data.monthlyValues).reduce((acc, [month, value]) => ({
      ...acc,
      [month]: Number(value) || 0
    }), {} as MonthlyValues);

    const requestData = {
      ...data,
      monthlyValues
    };

    console.log('Sending request with data:', JSON.stringify(requestData, null, 2));

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        return {
          success: false,
          error: errorData.error || `Server error: ${response.status}`
        };
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        return {
          success: false,
          error: `Server error: ${response.status}. Raw response: ${errorText}`
        };
      }
    }

    const responseText = await response.text();
    console.log('Success response text:', responseText);

    try {
      const responseData = JSON.parse(responseText);
      return responseData;
    } catch (parseError) {
      console.error('Failed to parse success response:', parseError);
      return {
        success: false,
        error: 'Invalid response format from server'
      };
    }
  } catch (error) {
    console.error('Error in createWRVUAdjustment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export async function updateWRVUAdjustment(id: string, data: WRVUAdjustmentFormData): Promise<WRVUAdjustmentResponse> {
  try {
    console.log('Updating wRVU adjustment:', id, 'with data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.name) {
      return {
        success: false,
        error: 'Name is required'
      };
    }
    if (!data.providerId) {
      return {
        success: false,
        error: 'Provider ID is required'
      };
    }
    if (!data.year) {
      return {
        success: false,
        error: 'Year is required'
      };
    }

    // Ensure all monthly values are numbers
    const monthlyValues = Object.entries(data.monthlyValues).reduce((acc, [month, value]) => ({
      ...acc,
      [month]: Number(value) || 0
    }), {} as MonthlyValues);

    const requestData = {
      ...data,
      monthlyValues
    };

    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        return {
          success: false,
          error: errorData.error || `Server error: ${response.status}`
        };
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        return {
          success: false,
          error: `Server error: ${response.status}. Raw response: ${errorText}`
        };
      }
    }

    const responseText = await response.text();
    console.log('Success response text:', responseText);

    try {
      const responseData = JSON.parse(responseText);
      return responseData;
    } catch (parseError) {
      console.error('Failed to parse success response:', parseError);
      return {
        success: false,
        error: 'Invalid response format from server'
      };
    }
  } catch (error) {
    console.error('Error in updateWRVUAdjustment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export async function deleteWRVUAdjustment(id: string): Promise<WRVUAdjustmentResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
} 