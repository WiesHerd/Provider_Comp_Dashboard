import { AdditionalPay, AdditionalPayFormData, AdditionalPayResponse, MonthlyValues } from '@/types/additional-pay';

const API_BASE = '/api/additional-pay';

export async function getAdditionalPay(providerId: string, year: number): Promise<AdditionalPayResponse> {
  console.log('Fetching additional pay for provider:', providerId, 'year:', year);
  
  const response = await fetch(`${API_BASE}?providerId=${providerId}&year=${year}`);
  if (!response.ok) {
    throw new Error('Failed to fetch additional pay');
  }
  
  return response.json();
}

export async function createAdditionalPay(data: AdditionalPayFormData): Promise<AdditionalPayResponse> {
  console.log('Creating additional pay:', data);
  
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create additional pay');
  }

  return response.json();
}

export async function updateAdditionalPay(id: string, formData: AdditionalPayFormData) {
  try {
    // Validate required fields
    if (!formData.name?.trim()) {
      throw new Error('Name is required');
    }

    if (!formData.providerId) {
      throw new Error('Provider ID is required');
    }

    if (!formData.year || typeof formData.year !== 'number') {
      throw new Error('Valid year is required');
    }

    // Ensure all monthly values are valid numbers
    const monthlyValues = {
      jan: parseFloat(String(formData.monthlyValues.jan)) || 0,
      feb: parseFloat(String(formData.monthlyValues.feb)) || 0,
      mar: parseFloat(String(formData.monthlyValues.mar)) || 0,
      apr: parseFloat(String(formData.monthlyValues.apr)) || 0,
      may: parseFloat(String(formData.monthlyValues.may)) || 0,
      jun: parseFloat(String(formData.monthlyValues.jun)) || 0,
      jul: parseFloat(String(formData.monthlyValues.jul)) || 0,
      aug: parseFloat(String(formData.monthlyValues.aug)) || 0,
      sep: parseFloat(String(formData.monthlyValues.sep)) || 0,
      oct: parseFloat(String(formData.monthlyValues.oct)) || 0,
      nov: parseFloat(String(formData.monthlyValues.nov)) || 0,
      dec: parseFloat(String(formData.monthlyValues.dec)) || 0,
    };

    const data = {
      ...formData,
      monthlyValues,
    };

    console.log('Updating additional pay:', { id, data });
    const response = await fetch(`/api/additional-pay/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log('Update response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.error || `Failed to update additional pay: ${response.status}`);
    }

    if (!responseData.success) {
      throw new Error(responseData.error || 'Failed to update additional pay');
    }

    // Even if responseData.data is empty, if we got here the update was successful
    return responseData.data || {
      id,
      name: formData.name.trim(),
      description: formData.description?.trim() ?? '',
      year: formData.year,
      providerId: formData.providerId,
      type: 'additionalPay',
      ...monthlyValues
    };
  } catch (error) {
    console.error('Error in updateAdditionalPay:', error);
    throw error;
  }
}

export async function deleteAdditionalPay(id: string): Promise<{ success: boolean; error?: string }> {
  console.log('Deleting additional pay:', id);
  
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || `Failed to delete additional pay: ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true };
  } catch (error) {
    console.error('Error deleting additional pay:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete additional pay' 
    };
  }
} 