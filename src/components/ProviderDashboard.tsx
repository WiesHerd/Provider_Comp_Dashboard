import { useState } from 'react';
import { updateAdditionalPay } from '@/services/additional-pay';
import { AdditionalPayFormData } from '@/types';
import type { AdditionalPay } from '@prisma/client';

export default function ProviderDashboard() {
  const [additionalPayData, setAdditionalPayData] = useState<AdditionalPay[]>([]);
  const [selectedAdditionalPayId, setSelectedAdditionalPayId] = useState<string | null>(null);
  const [showAdditionalPayModal, setShowAdditionalPayModal] = useState(false);

  const handleUpdateAdditionalPay = async (data: AdditionalPayFormData) => {
    try {
      if (!selectedAdditionalPayId) {
        console.error('No additional pay selected for update');
        return;
      }

      console.log('Updating additional pay:', { id: selectedAdditionalPayId, data });
      const updatedPay = await updateAdditionalPay(selectedAdditionalPayId, data);
      console.log('Update successful:', updatedPay);

      // Update the local state with the new data
      setAdditionalPayData(prevData => {
        const updatedData = prevData.filter(item => item.id !== selectedAdditionalPayId);
        return [...updatedData, updatedPay];
      });

      // Close the modal and clear selection
      setShowAdditionalPayModal(false);
      setSelectedAdditionalPayId(null);
    } catch (error) {
      console.error('Failed to update additional pay:', error);
      // Show error message to user (assuming you have a toast or alert component)
      alert(error instanceof Error ? error.message : 'Failed to update additional pay');
    }
  }; 