export const compensationService = {
  async getProviderChanges(providerId: string): Promise<CompensationChange[]> {
    const response = await fetch(`/api/providers/${providerId}/compensation-changes`);
    return response.json();
  },

  async createChange(providerId: string, change: Omit<CompensationChange, 'id'>): Promise<CompensationChange> {
    const response = await fetch(`/api/providers/${providerId}/compensation-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(change)
    });
    return response.json();
  },

  async updateChange(providerId: string, change: CompensationChange): Promise<CompensationChange> {
    const response = await fetch(`/api/providers/${providerId}/compensation-changes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(change)
    });
    return response.json();
  },

  async deleteChange(providerId: string, changeId: string): Promise<void> {
    await fetch(`/api/providers/${providerId}/compensation-changes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: changeId })
    });
  }
}; 