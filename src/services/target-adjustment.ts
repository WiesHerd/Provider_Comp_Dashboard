import { TargetAdjustment, TargetAdjustmentFormData, TargetAdjustmentResponse } from '@/types/target-adjustment';

const API_BASE = '/api/target-adjustments';

export async function getTargetAdjustments(providerId: string, year: number): Promise<TargetAdjustmentResponse> {
  console.log('Fetching target adjustments for provider:', providerId, 'year:', year);
  
  const response = await fetch(`${API_BASE}?providerId=${providerId}&year=${year}`);
  if (!response.ok) {
    throw new Error('Failed to fetch target adjustments');
  }
  
  return response.json();
}

export async function createTargetAdjustment(data: TargetAdjustmentFormData): Promise<TargetAdjustmentResponse> {
  console.log('Creating target adjustment:', data);
  
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create target adjustment');
  }

  return response.json();
}

export async function updateTargetAdjustment(id: string, data: TargetAdjustmentFormData): Promise<TargetAdjustmentResponse> {
  console.log('Updating target adjustment:', id, data);
  
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update target adjustment');
  }

  return response.json();
}

export async function deleteTargetAdjustment(id: string): Promise<{ success: boolean; error?: string }> {
  console.log('Deleting target adjustment:', id);
  
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || `Failed to delete target adjustment: ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true };
  } catch (error) {
    console.error('Error deleting target adjustment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete target adjustment' 
    };
  }
} 