import { TargetAdjustment, TargetAdjustmentFormData, TargetAdjustmentResponse } from '@/types/target-adjustment';
import { MonthlyValues } from '@/types/wrvu-adjustment';

const API_BASE = '/api/target-adjustments';

export async function getTargetAdjustments(providerId: string, year: number): Promise<TargetAdjustmentResponse[]> {
  console.log('Fetching target adjustments for provider:', providerId, 'year:', year);
  
  const response = await fetch(`/api/target-adjustments?providerId=${providerId}&year=${year}`);
  if (!response.ok) {
    throw new Error('Failed to fetch target adjustments');
  }
  
  const result = await response.json();
  return result.data;
}

export async function createTargetAdjustment(data: TargetAdjustmentFormData): Promise<TargetAdjustmentResponse> {
  console.log('Creating target adjustment:', data);
  
  const response = await fetch('/api/target-adjustments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create target adjustment');
  }

  const result = await response.json();
  return result.data;
}

export async function updateTargetAdjustment(id: string, data: TargetAdjustmentFormData): Promise<TargetAdjustmentResponse> {
  console.log('Updating target adjustment:', id, data);
  
  const response = await fetch(`/api/target-adjustments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update target adjustment');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteTargetAdjustment(id: string): Promise<void> {
  console.log('Deleting target adjustment:', id);
  
  const response = await fetch(`/api/target-adjustments/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete target adjustment');
  }
} 