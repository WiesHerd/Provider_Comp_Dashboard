import { AdditionalPay, AdditionalPayFormData, AdditionalPayResponse } from '@/types/additional-pay';

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

export async function updateAdditionalPay(id: string, data: AdditionalPayFormData): Promise<AdditionalPayResponse> {
  console.log('Updating additional pay:', id, data);
  
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update additional pay');
  }

  return response.json();
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