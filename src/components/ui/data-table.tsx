import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface Provider {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  department: string;
  status: string;
  hireDate: string;
  fte: number;
  baseSalary: number;
  compensationModel: string;
}

interface DataTableProps {
  onSelectionChange: (selectedIds: string[]) => void;
}

export function DataTable({ onSelectionChange }: DataTableProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(providers.map(provider => provider.employeeId));
      setSelectedRows(allIds);
      onSelectionChange(Array.from(allIds));
    } else {
      setSelectedRows(new Set());
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (employeeId: string, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(employeeId);
    } else {
      newSelection.delete(employeeId);
    }
    setSelectedRows(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRows.size === providers.length && providers.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead>FTE</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Comp Model</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.employeeId}>
              <TableCell>
                <Checkbox
                  checked={selectedRows.has(provider.employeeId)}
                  onCheckedChange={(checked) => handleSelectRow(provider.employeeId, checked as boolean)}
                  aria-label={`Select ${provider.firstName} ${provider.lastName}`}
                />
              </TableCell>
              <TableCell>{provider.employeeId}</TableCell>
              <TableCell>{`${provider.firstName} ${provider.lastName}`}</TableCell>
              <TableCell>{provider.email}</TableCell>
              <TableCell>{provider.specialty}</TableCell>
              <TableCell>{provider.department}</TableCell>
              <TableCell>{new Date(provider.hireDate).toLocaleDateString()}</TableCell>
              <TableCell>{provider.fte.toFixed(2)}</TableCell>
              <TableCell>${provider.baseSalary.toLocaleString()}</TableCell>
              <TableCell>{provider.compensationModel}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 