import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TierModal, TierFormData } from './TierModal';

interface Tier {
  id: string;
  name: string;
  threshold: number;
  conversionFactor: number;
}

interface TierManagementProps {
  configId: string;
  tiers: Tier[];
  thresholdType: 'WRVU' | 'Percentile';
  onTierAdded: (tier: TierFormData) => Promise<void>;
  onTierDeleted: (tierId: string) => Promise<void>;
}

export function TierManagement({ configId, tiers, thresholdType, onTierAdded, onTierDeleted }: TierManagementProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTier, setSelectedTier] = React.useState<Tier | null>(null);

  const handleAddTier = async (data: TierFormData) => {
    await onTierAdded(data);
    setIsModalOpen(false);
  };

  const handleDeleteTier = async (tierId: string) => {
    if (confirm('Are you sure you want to delete this tier?')) {
      await onTierDeleted(tierId);
    }
  };

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tiers</h3>
        <Button onClick={() => {
          setSelectedTier(null);
          setIsModalOpen(true);
        }}>
          Add New Tier
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>{thresholdType === 'WRVU' ? 'wRVU Threshold' : 'Percentile Threshold'}</TableHead>
            <TableHead>Conversion Factor</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTiers.map((tier) => (
            <TableRow key={tier.id}>
              <TableCell>{tier.name}</TableCell>
              <TableCell>{tier.threshold}</TableCell>
              <TableCell>${tier.conversionFactor.toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTier(tier.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {sortedTiers.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No tiers configured. Add your first tier to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTier}
        initialData={selectedTier || undefined}
        configType={thresholdType}
      />
    </div>
  );
} 