'use client';

import { FC, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComparisonTable } from './components/ComparisonTable';
import { useToast } from '@/components/ui/use-toast';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  department: string;
  compensationModel: string;
  yearsOfExperience: number;
  fte: number;
  clinicalFte: number;
  nonClinicalFte: number;
  baseSalary: number;
  clinicalSalary: number;
  nonClinicalSalary: number;
  metrics: {
    baseSalary: number;
    monthlyBaseSalary: number;
    monthlyWRVUs: number;
    monthlyTargetWRVUs: number;
    ytdBase: number;
    ytdIncentives: number;
    ytdAdditionalPay: number;
    totalYTDCompensation: number;
    ytdWRVUs: number;
    ytdTargetWRVUs: number;
    planProgress: number;
    wrvuPercentile: number;
    compPercentile: number;
    compPerWRVU: number;
    productivityCompGap: number;
  };
}

interface ComparisonResponse {
  provider1: Provider;
  provider2: Provider;
  chartData: Array<{
    metric: string;
    provider1: number;
    provider2: number;
  }>;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getMonthNumber = (monthName: string) => {
  return months.indexOf(monthName) + 1;
};

const CompensationComparisonPage: FC = () => {
  const { toast } = useToast();
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [provider1, setProvider1] = useState<string>('');
  const [provider2, setProvider2] = useState<string>('');
  const [providers, setProviders] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch specialties list
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        console.log('Fetching specialties...');
        const response = await fetch('/api/providers/filter-options');
        if (!response.ok) throw new Error('Failed to fetch specialties');
        
        const data = await response.json();
        console.log('Received specialties:', data.specialties);
        
        if (data.specialties && Array.isArray(data.specialties)) {
          setSpecialties(data.specialties);
          if (data.specialties.length > 0) {
            setSpecialty(data.specialties[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching specialties:', error);
        toast({
          title: 'Error',
          description: 'Failed to load specialties list',
          variant: 'destructive'
        });
      }
    };

    fetchSpecialties();
  }, [toast]);

  // Fetch providers list when specialty changes
  useEffect(() => {
    const fetchProviders = async () => {
      if (!specialty) {
        setProviders([]);
        return;
      }
      
      try {
        console.log('Fetching providers for specialty:', specialty);
        const response = await fetch(`/api/providers/comparison?specialty=${encodeURIComponent(specialty)}`);
        if (!response.ok) throw new Error('Failed to fetch providers');
        
        const data = await response.json();
        console.log('Received providers:', data);
        setProviders(data);
      } catch (error) {
        console.error('Error fetching providers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load providers list',
          variant: 'destructive'
        });
        setProviders([]);
      }
    };

    fetchProviders();
  }, [specialty, toast]);

  // Fetch comparison data when both providers and month are selected
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!provider1 || !provider2 || !month) return;

      setLoading(true);
      try {
        const monthNumber = getMonthNumber(month);
        const currentYear = new Date().getFullYear();
        
        console.log('Fetching comparison data with params:', {
          provider1,
          provider2,
          month: monthNumber,
          year: currentYear
        });
        
        const response = await fetch(
          `/api/reports/compensation-comparison?provider1=${provider1}&provider2=${provider2}&month=${monthNumber}&year=${currentYear}`
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(`Failed to fetch comparison data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched comparison data:', data);
        setComparisonData(data);
      } catch (error) {
        console.error('Error fetching comparison data:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load comparison data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [provider1, provider2, month, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Provider Compensation Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Compare compensation and productivity metrics between providers
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <span className="text-sm font-medium">Specialty</span>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="Select specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">YTD Through Month</span>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Provider 1</span>
          <Select value={provider1} onValueChange={setProvider1}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Provider 2</span>
          <Select value={provider2} onValueChange={setProvider2}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : comparisonData ? (
          <ComparisonTable 
            provider1={comparisonData.provider1}
            provider2={comparisonData.provider2}
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            Select two providers and a month to view comparison
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompensationComparisonPage; 
