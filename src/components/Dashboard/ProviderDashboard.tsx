'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AddAdjustmentModal from './AddAdjustmentModal';
import WRVUChart from './WRVUChart';
import WRVUGauge from './WRVUGauge';
import { CurrencyDollarIcon, ChartBarIcon, PencilIcon, TrashIcon, PlusIcon, Cog6ToothIcon, BanknotesIcon, ChartPieIcon, ScaleIcon, ArrowTrendingUpIcon, ArrowPathIcon, ArrowDownTrayIcon, InformationCircleIcon, DocumentTextIcon, ChevronDownIcon, ArrowLeftIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CompensationHistory from './CompensationHistory';
import CompensationChangeModalComponent from './CompensationChangeModal';
import { CompensationChange } from '@/types/compensation';
import { MarketData } from '@/types/market-data';
import { 
  ColDef, 
  GridApi, 
  GridReadyEvent,
  GetRowIdParams,
  ValueSetterParams,
  CellClickedEvent
} from 'ag-grid-community';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createWRVUAdjustment, deleteWRVUAdjustment } from '@/services/wrvu-adjustment';
import { createTargetAdjustment, deleteTargetAdjustment } from '@/services/target-adjustment';
import { useToast } from '@/components/ui/use-toast';
import type { WRVUAdjustment, TargetAdjustment } from '@/types';

interface Provider {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  suffix?: string;
  specialty: string;
  fte: number;
  baseSalary: number;
  compensationModel: string;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthlyDetail {
  changed: boolean;
  prorated: boolean;
  oldAnnual?: number;
  newAnnual?: number;
  oldFTE?: number;
  newFTE?: number;
  oldDays?: number;
  newDays?: number;
  oldMonthly?: number;
  newMonthly?: number;
  total?: number;
}

interface ProviderDashboardProps {
  provider: Provider;
}

// Proration logic updated for clarity:
// - If no change in a month: full old/current salary/FTE.
// - If change day 1: entire month at newAnnual*newFTE/12
// - If change mid-month: portion old + portion new based on days.
function getMonthlySalaries(
  baseAnnualSalary: number,
  baseFTE: number,
  compensationHistory: CompensationChange[]
): { monthlySalaries: Record<string, number>, monthlyDetails: Record<string, MonthlyDetail> } {
  const sortedChanges = [...compensationHistory].sort((a, b) => 
    new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
  );

  // Start with the most recent known salary before any changes
  let currentAnnualSalary = sortedChanges.length > 0 ? sortedChanges[0].previousSalary : baseAnnualSalary;
  let currentFTE = sortedChanges.length > 0 ? (sortedChanges[0].previousFTE || baseFTE) : baseFTE;
  
  const monthlySalaries: Record<string, number> = {};
  const monthlyDetails: Record<string, MonthlyDetail> = {};

  const year = 2024;

  for (let i = 0; i < 12; i++) {
    const monthIndex = i;
    const monthKey = months[monthIndex].toLowerCase();
    const monthlyChanges = sortedChanges.filter(ch => {
      const effDate = new Date(ch.effectiveDate);
      return effDate.getMonth() === monthIndex;
    });

    if (monthlyChanges.length === 0) {
      monthlySalaries[monthKey] = (currentAnnualSalary * currentFTE) / 12;
      monthlyDetails[monthKey] = { 
        changed: false, 
        prorated: false,
        oldAnnual: currentAnnualSalary,
        oldFTE: currentFTE
      };
      continue;
    }

    // Handle the change for this month
    const change = monthlyChanges[0];
    const changeDate = new Date(change.effectiveDate);
    const dayOfChange = changeDate.getDate();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const oldAnnual = currentAnnualSalary;
    const oldFTE = currentFTE;
    const newAnnual = change.newSalary;
    const newFTE = change.newFTE ?? oldFTE;

    if (dayOfChange === 1) {
      // Entire month at new salary and FTE
      monthlySalaries[monthKey] = (newAnnual * newFTE) / 12;
    monthlyDetails[monthKey] = {
      changed: true,
      prorated: false,
      oldAnnual,
      newAnnual,
      oldFTE,
      newFTE
    };
    } else {
      // Prorate the month based on days
      const oldDays = dayOfChange - 1;
      const newDays = daysInMonth - oldDays;
      
      const oldMonthlyAmount = ((oldAnnual * oldFTE) / 12) * (oldDays / daysInMonth);
      const newMonthlyAmount = ((newAnnual * newFTE) / 12) * (newDays / daysInMonth);
      const total = oldMonthlyAmount + newMonthlyAmount;

      monthlySalaries[monthKey] = total;
      monthlyDetails[monthKey] = {
        changed: true,
        prorated: true,
        oldAnnual,
        newAnnual,
        oldFTE,
        newFTE,
        oldDays,
        newDays,
        oldMonthly: oldMonthlyAmount,
        newMonthly: newMonthlyAmount,
        total
      };
    }

    // Update current values for future months
    currentAnnualSalary = newAnnual;
    currentFTE = newFTE;
  }

  return { monthlySalaries, monthlyDetails };
}

function calculateMonthlyTarget(annualSalary: number, conversionFactor: number, fte: number = 1.0) {
  const annualTarget = (annualSalary * fte) / conversionFactor;
  const monthlyTarget = annualTarget / 12;
  return Object.fromEntries(months.map(m => [m.toLowerCase(), monthlyTarget]));
}

function calculateTotalWRVUs(baseData: any, adjustments: any[]) {
  const result = { ...baseData };
  months.forEach(m => {
    const mk = m.toLowerCase();
    let total = Number(baseData[mk]) || 0;
    adjustments.forEach(adj => {
      const adjValue = Number(adj[mk]) || 0;
      if (!isNaN(adjValue)) total += adjValue;
    });
    result[mk] = total;
  });
  result.ytd = months.reduce((sum, mm) => sum + (result[mm.toLowerCase()] || 0), 0);
  return result;
}

function calculateTotalTargets(baseTargetData: any, targetAdjustments: any[]) {
  const result = { ...baseTargetData };
  months.forEach(m => {
    const mk = m.toLowerCase();
    const adjustmentSum = targetAdjustments.reduce((sum, adj) => sum + (typeof adj[mk] === 'number' ? adj[mk] : 0), 0);
    result[mk] = (result[mk] || 0) + adjustmentSum;
  });
  result.ytd = months.reduce((sum, mm) => sum + (result[mm.toLowerCase()] || 0), 0);
  return result;
}

function calculateVariance(totalWRVUs: any, targetData: any) {
  const result: any = {};
  if (!totalWRVUs || !targetData) return result;
  months.forEach(m => {
    const mk = m.toLowerCase();
    const actual = Number(totalWRVUs[mk]) || 0;
    const target = Number(targetData[mk]) || 0;
    result[mk] = actual - target;
  });
  result.ytd = months.reduce((sum, mm) => sum + (result[mm.toLowerCase()] || 0), 0);
  return result;
}

const calculateIncentive = (variance: number, cf: number): number => {
  return variance > 0 ? variance * cf : 0;
};

function calculateYTD(baseData: any, adjustmentRows: any[]) {
  let ytd = 0;
  months.forEach(m => {
    const mk = m.toLowerCase();
    ytd += Number(baseData[mk]) || 0;
    adjustmentRows.forEach(adj => {
      ytd += Number(adj[mk]) || 0;
    });
  });
  return ytd;
}

function calculatePlanYearProgress(rowData: any[]) {
  const actualWRVUsRow = rowData.find(r => r.metric === 'Actual wRVUs');
  if (!actualWRVUsRow) return { completed: 0, total: 12, percentage: 0 };
  const monthsWithData = months.reduce((count, m) => (actualWRVUsRow[m.toLowerCase()] > 0 ? count + 1 : count), 0);
  return { completed: monthsWithData, total: 12, percentage: (monthsWithData / 12) * 100 };
}

function calculateYTDTargetProgress(rowData: any[]) {
  const ytdWRVUs = rowData.find(r => r.metric === 'Total wRVUs')?.ytd || 0;
  const ytdTarget = rowData.find(r => r.metric === 'Total Target')?.ytd || 0;
  return { actual: ytdWRVUs, target: ytdTarget, percentage: ytdTarget > 0 ? (ytdWRVUs / ytdTarget) * 100 : 0 };
}

const SYSTEM_ROWS = ['Base Salary', 'Incentives', 'Holdback (20%)', 'Total Comp.'];

const SummaryCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconBackgroundColor?: string;
}> = ({ title, value, subtitle, icon, iconBackgroundColor }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 flex items-start">
    <div className={`w-10 h-10 mr-4 rounded-full flex items-center justify-center ${iconBackgroundColor || 'bg-blue-100'}`}>
      <span className="text-lg">{icon}</span>
    </div>
    <div>
      <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 break-words">{value}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
  </div>
);

const ProratedCellRenderer = (props: any) => {
  const { value, data, colDef, context } = props;
  if (data.component === 'Base Salary') {
    const monthKey = colDef.field;
    const details = context.monthlyDetails[monthKey];

    if (details && details.changed) {
      let tooltipText = '';
      if (details.prorated) {
        tooltipText =
          `Old Annual: ${formatCurrency(details.oldAnnual || 0)}\n` +
          `Old FTE: ${details.oldFTE}\n`+
          `New Annual: ${formatCurrency(details.newAnnual || 0)}\n` +
          `New FTE: ${details.newFTE}\n`+
          `Old Portion (${details.oldDays} days): ${formatCurrency(details.oldMonthly || 0)}\n` +
          `New Portion (${details.newDays} days): ${formatCurrency(details.newMonthly || 0)}\n` +
          `Total: ${formatCurrency(details.total || 0)}`;
      } else {
        tooltipText =
          `Old Annual: ${formatCurrency(details.oldAnnual || 0)}\n` +
          `Old FTE: ${details.oldFTE}\n`+
          `New Annual: ${formatCurrency(details.newAnnual || 0)}\n` +
          `New FTE: ${details.newFTE}\n`+
          `No partial proration, full month at new rate.`;
      }

      return (
        <span 
          style={{
            fontWeight:'bold',
            background:'#fffae6',
            padding:'0 4px',
            borderRadius:'4px',
            whiteSpace:'nowrap'
          }}
          title={tooltipText}
        >
          {formatCurrency(value)} ℹ️
        </span>
      );
    }
  }
  return <span title={formatCurrency(value)}>{formatCurrency(value)}</span>;
};

interface CompensationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSalary: number;
  currentFTE: number;
  conversionFactor: number;
  onSave: (data: CompensationChange) => void;
}

function CompensationChangeModal({
  isOpen,
  onClose,
  currentSalary,
  currentFTE,
  conversionFactor,
  onSave
}: CompensationChangeModalProps) {
  const [newSalary, setNewSalary] = useState(currentSalary);
  const [newFTE, setNewFTE] = useState(currentFTE);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      effectiveDate,
      newSalary,
      newFTE,
      conversionFactor,
      reason: changeReason,
    });
    // Reset form
    setNewSalary(currentSalary);
    setNewFTE(currentFTE);
    setEffectiveDate('');
    setChangeReason('');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Record Compensation Change
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Effective Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Salary
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(currentSalary)}
                          disabled
                          className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Salary <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            required
                            value={newSalary}
                            onChange={(e) => setNewSalary(Number(e.target.value))}
                            className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current FTE
                        </label>
                        <input
                          type="text"
                          value={currentFTE}
                          disabled
                          className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New FTE <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          step="0.1"
                          min="0"
                          max="1"
                          value={newFTE}
                          onChange={(e) => setNewFTE(Number(e.target.value))}
                          className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conversion Factor <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          required
                          value={conversionFactor}
                          disabled
                          className="block w-full rounded-md border-gray-300 pl-7 bg-gray-50 shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Change <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter reason for compensation change..."
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Change Summary</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>Salary Change: {formatCurrency(currentSalary)} → {formatCurrency(newSalary)}</p>
                        <p>FTE Change: {currentFTE} → {newFTE}</p>
                        <p>Effective: {effectiveDate || 'Invalid Date'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Save Change
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function ProviderDashboard({ provider }: ProviderDashboardProps) {
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [metricsGridApi, setMetricsGridApi] = useState<GridApi | null>(null);
  const [compensationGridApi, setCompensationGridApi] = useState<GridApi | null>(null);
  const [baseMonthlyData, setBaseMonthlyData] = useState<Record<string, number>>(
    Object.fromEntries(months.map((m) => [m.toLowerCase(), 0]))
  );
  const [isLoading, setIsLoading] = useState(true);

  const [activeView, setActiveView] = useState('compensation');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'wrvu' | 'target' | 'additionalPay'>('wrvu');
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [targetAdjustments, setTargetAdjustments] = useState<any[]>([]);
  const [additionalPayments, setAdditionalPayments] = useState<any[]>([]);
  const [compensationHistory, setCompensationHistory] = useState<CompensationChange[]>([]);
  const [isCompChangeModalOpen, setIsCompChangeModalOpen] = useState(false);
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [annualSalary, setAnnualSalary] = useState(provider.baseSalary);
  const [fte, setFte] = useState(provider.fte);

  const [newSalary, setNewSalary] = useState<number>(0);
  const [newFTE, setNewFTE] = useState(1.0);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const [isGaugesVisible, setIsGaugesVisible] = useState(true);
  const [isWRVUChartVisible, setIsWRVUChartVisible] = useState(true);
  const [isMetricsTableVisible, setIsMetricsTableVisible] = useState(true);
  const [isCompTableVisible, setIsCompTableVisible] = useState(true);

  const [holdbackPercentage, setHoldbackPercentage] = useState(5);
  const [marketData, setMarketData] = useState<any[]>([]);

  const [editingWRVUAdjustment, setEditingWRVUAdjustment] = useState<any>(null);
  const [editingTargetAdjustment, setEditingTargetAdjustment] = useState<any>(null);

  // Add filtered providers based on search
  const filteredProviders = useMemo(() => {
    return providers.filter(p => 
      `${p.firstName} ${p.lastName} ${p.employeeId}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [providers, searchTerm]);

  useEffect(() => {
    // Fetch market data
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market-data');
        if (!response.ok) throw new Error('Failed to fetch market data');
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketData();
  }, []);

  useEffect(() => {
    const fetchWRVUData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/wrvu-data');
        if (!response.ok) {
          throw new Error('Failed to fetch wRVU data');
        }
        const data = await response.json();
        console.log('All wRVU data:', data);
        
        const providerData = data.find((d: any) => d.employee_id === provider.employeeId);
        console.log('Provider employeeId:', provider.employeeId);
        console.log('Found provider data:', providerData);
        
        if (providerData) {
          const monthlyData = {
            jan: providerData.jan || 0,
            feb: providerData.feb || 0,
            mar: providerData.mar || 0,
            apr: providerData.apr || 0,
            may: providerData.may || 0,
            jun: providerData.jun || 0,
            jul: providerData.jul || 0,
            aug: providerData.aug || 0,
            sep: providerData.sep || 0,
            oct: providerData.oct || 0,
            nov: providerData.nov || 0,
            dec: providerData.dec || 0
          };
          console.log('Setting monthly data:', monthlyData);
          setBaseMonthlyData(monthlyData);
        } else {
          console.log('No provider data found, setting zeros');
          setBaseMonthlyData(Object.fromEntries(months.map((m) => [m.toLowerCase(), 0])));
        }
      } catch (error) {
        console.error('Error fetching wRVU data:', error);
        setBaseMonthlyData(Object.fromEntries(months.map((m) => [m.toLowerCase(), 0])));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWRVUData();
  }, [provider.employeeId]);

  // Get conversion factor from market data
  const getConversionFactor = () => {
    const matchingMarketData = marketData.find(data => data.specialty === provider.specialty);
    return matchingMarketData ? matchingMarketData.p50_cf : 0;
  };

  const { monthlySalaries, monthlyDetails } = useMemo(
    () => getMonthlySalaries(annualSalary, fte, compensationHistory),
    [annualSalary, fte, compensationHistory]
  );

  const targetMonthlyData = useMemo(
    () => calculateMonthlyTarget(annualSalary, getConversionFactor(), fte),
    [annualSalary, marketData, provider.specialty, fte]
  );

  const totalWRVUs = useMemo(() => {
    if (isLoading) return Object.fromEntries(months.map((m) => [m.toLowerCase(), 0]));
    return calculateTotalWRVUs(baseMonthlyData, adjustments);
  }, [baseMonthlyData, adjustments, isLoading]);

  const totalTargetsWithAdjustments = useMemo(() => calculateTotalTargets(targetMonthlyData, targetAdjustments), [targetMonthlyData, targetAdjustments]);
  const monthlyVariances = useMemo(() => calculateVariance(totalWRVUs, totalTargetsWithAdjustments), [totalWRVUs, totalTargetsWithAdjustments]);

  const totalIncentives = useMemo(() => {
    const cf = getConversionFactor();
    return months.reduce((acc: number, m: string) => {
      const v = monthlyVariances[m.toLowerCase()] || 0;
      return acc + calculateIncentive(v, cf);
    }, 0);
  }, [monthlyVariances, getConversionFactor, months]);

  const ytdWRVUs = totalWRVUs.ytd;

  const getRowData = useCallback(() => {
    const wrvuYTD = calculateYTD(baseMonthlyData, adjustments);
    const targetYTD = calculateYTD(targetMonthlyData, targetAdjustments);
    const varianceYTD = wrvuYTD - targetYTD;

    return [
      { metric: 'wRVU Generation', isHeader: true, section: 'generation' },
      { metric: 'Actual wRVUs', ...baseMonthlyData, ytd: calculateYTD(baseMonthlyData, []), section: 'generation' },
      ...adjustments.map(adj => ({
        metric: adj.name,
        ...adj,
        type: 'wrvu',
        isAdjustment: true,
        editable: true,
        ytd: calculateYTD(adj, []),
        section: 'generation'
      })),
      { metric: 'Total wRVUs', ...totalWRVUs, ytd: totalWRVUs.ytd, section: 'generation' },
      { metric: 'wRVU Target', isHeader: true, section: 'target' },
      { metric: 'Target wRVUs', ...targetMonthlyData, ytd: calculateYTD(targetMonthlyData, []), section: 'target' },
      ...targetAdjustments.map(adj => ({
        metric: adj.name,
        ...adj,
        type: 'target',
        isAdjustment: true,
        editable: true,
        ytd: calculateYTD(adj, []),
        section: 'target'
      })),
      { metric: 'Total Target', ...totalTargetsWithAdjustments, ytd: calculateYTD(targetMonthlyData, targetAdjustments), section: 'target' },
      { metric: 'Variance', ...monthlyVariances, ytd: varianceYTD }
    ];
  }, [adjustments, targetAdjustments, totalWRVUs, totalTargetsWithAdjustments, monthlyVariances, targetMonthlyData]);

  const getMonthlyIncentive = (month: string): number => {
    const monthKey = month.toLowerCase();
    const monthlyTarget = targetMonthlyData[monthKey] || 0;
    const monthlyActual = baseMonthlyData[monthKey] || 0;
    const variance = monthlyActual - monthlyTarget;
    return calculateIncentive(variance, getConversionFactor());
  };

  const monthlyBaseSalary = provider.baseSalary / 12;

  const getCompensationData = () => {
    const baseData = [
      {
        component: 'Base Salary',
        isSystem: true,
        ...monthlySalaries,
        ytd: Object.values(monthlySalaries).reduce((sum: number, val) => sum + (Number(val) || 0), 0),
      },
      {
        component: 'Incentives',
        isSystem: true,
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: getMonthlyIncentive(month) || 0,
        }), {}),
        ytd: months.reduce((sum, month) => sum + (getMonthlyIncentive(month) || 0), 0)
      },
      {
        component: `Holdback (${holdbackPercentage}%)`,
        isSystem: true,
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: -1 * (monthlySalaries[month.toLowerCase()] || 0) * (holdbackPercentage / 100),
        }), {}),
        ytd: -1 * Object.values(monthlySalaries).reduce((sum, val) => sum + (Number(val) || 0), 0) * (holdbackPercentage / 100)
      },
      ...additionalPayments.map(pay => ({
        ...pay,
        component: pay.name,
        isSystem: false,
        type: 'additionalPay',
        ytd: months.reduce((sum, month) => sum + (Number(pay[month.toLowerCase()]) || 0), 0)
      })),
    ];

    // Calculate YTD Incentives row with cumulative values
    const incentivesRow = baseData.find(row => row.component === 'Incentives');
    const ytdIncentivesRow = {
      component: 'YTD Incentives',
      isSystem: true,
      ...months.reduce((acc, month, index) => {
        const monthKey = month.toLowerCase();
        const cumulative = months
          .slice(0, index + 1)
          .reduce((sum, m) => sum + (Number(incentivesRow?.[m.toLowerCase()]) || 0), 0);
        return { ...acc, [monthKey]: cumulative };
      }, {}),
      ytd: incentivesRow?.ytd || 0
    };

    // Find the index of Call Pay to insert YTD Incentives after it
    const callPayIndex = baseData.findIndex(row => row.component === 'Call Pay');
    if (callPayIndex !== -1) {
      baseData.splice(callPayIndex + 1, 0, ytdIncentivesRow);
    } else {
      const lastSystemRowIndex = baseData.filter(row => row.isSystem).length - 1;
      baseData.splice(lastSystemRowIndex + 1, 0, ytdIncentivesRow);
    }

    const totals = months.reduce((acc, month) => {
      const monthKey = month.toLowerCase();
      const baseSalary = baseData.find(row => row.component === 'Base Salary')?.[monthKey] || 0;
      const incentives = baseData.find(row => row.component === 'Incentives')?.[monthKey] || 0;
      const holdback = baseData.find(row => row.component.includes('Holdback'))?.[monthKey] || 0;
      const additionalPays = baseData
        .filter(row => !row.isSystem)
        .reduce((sum, row) => sum + (Number(row[monthKey]) || 0), 0);
      
      const monthTotal = baseSalary + incentives + holdback + additionalPays;
      return { ...acc, [monthKey]: monthTotal };
    }, {});

    const baseSalaryYTD = baseData.find(row => row.component === 'Base Salary')?.ytd || 0;
    const incentivesYTD = baseData.find(row => row.component === 'Incentives')?.ytd || 0;
    const holdbackYTD = baseData.find(row => row.component.includes('Holdback'))?.ytd || 0;
    const additionalPaysYTD = baseData
      .filter(row => !row.isSystem)
      .reduce((sum, row) => sum + (Number(row.ytd) || 0), 0);
    const ytdTotal = baseSalaryYTD + incentivesYTD + holdbackYTD + additionalPaysYTD;

    // Calculate the percentile for YTD total compensation
    const { percentile, nearestBenchmark } = calculateTotalCompPercentile(ytdTotal, marketData);

    return [
      ...baseData,
      {
        component: 'Total Comp.',
        isSystem: true,
        ...totals,
        ytd: ytdTotal,
        percentile,
        nearestBenchmark
      },
    ];
  };

  const handleOpenAdjustmentModal = (type:'wrvu'|'target'|'additionalPay') => {
    setAdjustmentType(type);
    setIsAdjustmentModalOpen(true);
  };

  const handleAddAdjustment = async (data: any) => {
    try {
      if (adjustmentType === 'wrvu') {
        const adjustmentData = {
          id: isEditing ? editingWRVUAdjustment?.id : undefined,
          name: data.name || editingWRVUAdjustment?.name || '',
          description: data.description || editingWRVUAdjustment?.description || '',
          year: new Date().getFullYear(),
          providerId: provider.id,
          monthlyValues: {
            jan: Number(data.jan || 0),
            feb: Number(data.feb || 0),
            mar: Number(data.mar || 0),
            apr: Number(data.apr || 0),
            may: Number(data.may || 0),
            jun: Number(data.jun || 0),
            jul: Number(data.jul || 0),
            aug: Number(data.aug || 0),
            sep: Number(data.sep || 0),
            oct: Number(data.oct || 0),
            nov: Number(data.nov || 0),
            dec: Number(data.dec || 0)
          }
        };

        console.log('Sending adjustment data:', JSON.stringify(adjustmentData, null, 2));
        
        try {
          let apiResponse;
          if (isEditing && editingWRVUAdjustment?.id) {
            // Update existing adjustment
            apiResponse = await fetch(`/api/wrvu-adjustments/${editingWRVUAdjustment.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(adjustmentData)
            }).then(res => res.json());
          } else {
            // Create new adjustment
            apiResponse = await createWRVUAdjustment(adjustmentData);
          }

          console.log('API Response:', JSON.stringify(apiResponse, null, 2));

          if (!apiResponse.success) {
            console.error('Failed to save wRVU adjustment:', apiResponse.error);
            return;
          }

          // Update local state
          if (isEditing) {
            setAdjustments(prev => prev.map(adj => 
              adj.id === editingWRVUAdjustment?.id ? apiResponse.data : adj
            ));
          } else {
            setAdjustments(prev => [...prev, apiResponse.data]);
          }
          
          setIsAdjustmentModalOpen(false);
          setIsEditing(false);
          setEditingWRVUAdjustment(null);
        } catch (apiError) {
          console.error('API call failed:', apiError);
          return;
        }
      } else if (adjustmentType === 'target') {
        const adjustmentData = {
          id: isEditing ? editingTargetAdjustment?.id : undefined,
          name: data.name,
          description: data.description,
          year: new Date().getFullYear(),
          providerId: provider.id,
          monthlyValues: {
            jan: Number(data.jan || 0),
            feb: Number(data.feb || 0),
            mar: Number(data.mar || 0),
            apr: Number(data.apr || 0),
            may: Number(data.may || 0),
            jun: Number(data.jun || 0),
            jul: Number(data.jul || 0),
            aug: Number(data.aug || 0),
            sep: Number(data.sep || 0),
            oct: Number(data.oct || 0),
            nov: Number(data.nov || 0),
            dec: Number(data.dec || 0)
          }
        };

        console.log('Sending target adjustment data:', JSON.stringify(adjustmentData, null, 2));
        
        try {
          let response;
          if (isEditing && editingTargetAdjustment?.id) {
            // Update existing adjustment
            response = await fetch(`/api/target-adjustments/${editingTargetAdjustment.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(adjustmentData)
            });
          } else {
            // Create new adjustment
            response = await createTargetAdjustment(adjustmentData);
          }

          const result = await response.json();
          console.log('API Response:', JSON.stringify(result, null, 2));

          if (!result.success) {
            console.error('Failed to save target adjustment:', result.error);
            return;
          }

          // Update local state
          if (isEditing) {
            setTargetAdjustments(prev => prev.map(adj => 
              adj.id === editingTargetAdjustment?.id ? result.data : adj
            ));
          } else {
            setTargetAdjustments(prev => [...prev, result.data]);
          }
          
          setIsAdjustmentModalOpen(false);
          setIsEditing(false);
          setEditingTargetAdjustment(null);
        } catch (apiError) {
          console.error('API call failed:', apiError);
          return;
        }
      }

      setIsAdjustmentModalOpen(false);
    } catch (error) {
      console.error('Error in handleAddAdjustment:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  const handleEditAdjustment = (data: any) => {
    console.log('Raw adjustment data:', data);
    
    if (data.type === 'wrvu') {
      const wrvuAdjustment = {
        id: data.id,
        name: data.metric,
        description: data.description || '',
        providerId: provider.id,
        year: new Date().getFullYear(),
        jan: data.jan || 0,
        feb: data.feb || 0,
        mar: data.mar || 0,
        apr: data.apr || 0,
        may: data.may || 0,
        jun: data.jun || 0,
        jul: data.jul || 0,
        aug: data.aug || 0,
        sep: data.sep || 0,
        oct: data.oct || 0,
        nov: data.nov || 0,
        dec: data.dec || 0
      };
      setEditingWRVUAdjustment(wrvuAdjustment);
      setAdjustmentType('wrvu');
      setIsEditing(true);
      setIsAdjustmentModalOpen(true);
    } else if (data.type === 'target') {
      const targetAdjustment = {
        id: data.id,
        name: data.metric,
        description: data.description || '',
        providerId: provider.id,
        year: new Date().getFullYear(),
        jan: data.jan || 0,
        feb: data.feb || 0,
        mar: data.mar || 0,
        apr: data.apr || 0,
        may: data.may || 0,
        jun: data.jun || 0,
        jul: data.jul || 0,
        aug: data.aug || 0,
        sep: data.sep || 0,
        oct: data.oct || 0,
        nov: data.nov || 0,
        dec: data.dec || 0
      };
      setEditingTargetAdjustment(targetAdjustment);
      setAdjustmentType('target');
      setIsEditing(true);
      setIsAdjustmentModalOpen(true);
    }
  };

  const handleRemoveAdjustment = (id: string) => {
    setAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  const handleRemoveTargetAdjustment = (id: string) => {
    setTargetAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  const handleEditAdditionalPay = (payment: any) => {
    console.log('Raw payment data:', payment);
    
    // Pass the payment data directly without transformation
    setEditingPayment(payment);
    setAdjustmentType('additionalPay');
    setIsEditing(true);
    setIsAdjustmentModalOpen(true);
  };

  const handleRemoveAdditionalPay = (name: string) => {
    setAdditionalPayments(prev => prev.filter(p => p.name !== name));
  };

  const handleOpenCompChangeModal = () => {
    setIsCompChangeModalOpen(true);
  };

  const handleCloseCompChangeModal = () => {
    setIsCompChangeModalOpen(false);
    setNewSalary(provider.baseSalary);
    setNewFTE(provider.fte);
    setEffectiveDate('');
    setChangeReason('');
  };

  const handleCompensationChange = async (data: {
    effectiveDate: string;
    previousSalary: number;
    newSalary: number;
    previousFTE: number;
    newFTE: number;
    previousConversionFactor: number;
    newConversionFactor: number;
    reason?: string;
  }) => {
    try {
      const response = await fetch(`/api/providers/${provider.id}/compensation-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          providerId: provider.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(`Failed to save compensation change: ${response.status} - ${errorData?.error || 'Unknown error'}`);
      }

      const savedChange = await response.json();
      console.log('Saved compensation change:', savedChange);
      setCompensationHistory(prev => [...prev, savedChange]);
      setIsCompChangeModalOpen(false);
      setEditingChangeId(null);
    } catch (error) {
      console.error('Error saving compensation change:', error);
      throw error;
    }
  };

  const handleEditCompensationChange = (change: CompensationChange) => {
    if (change.id) {
      setEditingChangeId(change.id);
      setIsCompChangeModalOpen(true);
    }
  };

  const customStyles = `
    .ag-theme-alpine {
      --ag-header-height: 40px;
      --ag-row-height: 40px;
      --ag-header-foreground-color: #111827;
      --ag-header-background-color: #f3f4f6;
      --ag-odd-row-background-color: #ffffff;
      --ag-row-border-color: #f3f4f6;
      --ag-border-color: #e5e7eb;
      --ag-font-size: 12px;
      --ag-font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      border: 1px solid var(--ag-border-color);
      border-radius: 8px;
    }

    .ag-root-wrapper {
      border: none !important;
    }

    /* Remove gap between pinned right column */
    .ag-pinned-right-cols-container,
    .ag-pinned-right-header {
      margin-left: 0 !important;
    }

    /* Hide the vertical separator between main and pinned sections */
    .ag-right-aligned-header .ag-header-cell-resize::after {
      display: none !important;
    }

    /* Right align header text */
    .ag-header-cell-label {
      width: 100% !important;
      display: flex !important;
      justify-content: flex-end !important;
    }

    .ag-header-cell.left-align .ag-header-cell-label {
      justify-content: flex-start !important;
    }

    .ag-header-cell {
      padding: 0 2px !important;
    }

    .ag-cell {
      padding: 0 2px !important;
    }

    .number-cell {
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ag-cell-value {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  const formatNegativeValue = (value: number) => {
    if (value < 0) {
      return `(${formatNumber(Math.abs(value))})`;
    }
    return formatNumber(value);
  };

  const formatNegativeCurrency = (value: number) => {
    if (value < 0) {
      return `(${formatCurrency(Math.abs(value))})`;
    }
    return formatCurrency(value);
  };

  const metricsColumnDefs = [
    {
      field: 'metric',
      headerName: '',
      pinned: 'left' as const,
      width: 160,
      flex: 0,
      suppressSizeToFit: true,
      headerClass: 'left-align',
      cellRenderer: (params: any) => {
        if (params.data.isAdjustment) {
          return (
            <div className="flex items-center justify-between group pl-4">
              <span className="text-gray-900 adjustment-cell">{params.value}</span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditAdjustment(params.data)} 
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit adjustment"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (params.data.type === 'target') handleRemoveTargetAdjustment(params.data.id);
                    else handleRemoveAdjustment(params.data.id);
                  }} 
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete adjustment"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        }
        return <span className={params.data.isHeader ? 'font-semibold' : ''}>{params.value}</span>;
      },
      cellClass: (params: any) => {
        const classes: string[] = [];
        if (params.data.isHeader) classes.push('font-semibold');
        if (params.data.metric === 'Total wRVUs' || params.data.metric === 'Total Target') {
          classes.push('font-semibold');
        }
        return classes.join(' ');
      }
    },
    ...months.map((month) => ({
      field: month.toLowerCase(),
      headerName: month.toUpperCase(),
      flex: 1,
      suppressSizeToFit: false,
      headerClass: 'text-right',
      cellClass: (params: any) => {
        const classes = ['text-right'];
        if (params.value < 0) classes.push('text-red-600');
        if (params.data.metric === 'Total wRVUs' || params.data.metric === 'Total Target') {
          classes.push('font-semibold');
        }
        return classes.join(' ');
      },
      cellStyle: { textAlign: 'right' },
      valueFormatter: (params: any) => {
        if (params.data.isHeader) return '';
        return formatNegativeValue(params.value);
      },
    })) as ColDef[],
    {
      field: 'ytd',
      headerName: 'YTD',
      pinned: 'right' as const,
      width: 100,
      flex: 0,
      suppressSizeToFit: true,
      headerClass: 'text-right',
      cellClass: (params: any) => {
        const classes = ['text-right'];
        if (params.value < 0) classes.push('text-red-600');
        if (params.data.metric === 'Total wRVUs' || params.data.metric === 'Total Target') {
          classes.push('font-semibold');
        }
        return classes.join(' ');
      },
      cellStyle: { textAlign: 'right' },
      valueFormatter: (params: any) => {
        if (params.data.isHeader) return '';
        return formatNegativeValue(params.value);
      },
      lockPinned: true,
      lockPosition: true,
      suppressMovable: true,
      suppressSeparator: true
    }
  ];

  const compensationColumnDefs = [
    {
      field: 'component',
      headerName: '',
      pinned: 'left' as const,
      width: 160,
      flex: 0,
      suppressSizeToFit: true,
      headerClass: 'left-align',
      cellRenderer: (params: any) => {
        if (!params.data.isSystem && params.data.type === 'additionalPay') {
          return (
            <div className="flex items-center justify-between group">
              <span className="text-gray-900 adjustment-cell">{params.value}</span>
              <div className="flex gap-2 row-actions">
                <button 
                  onClick={() => handleEditAdditionalPay(params.data)} 
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit additional pay"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleRemoveAdditionalPay(params.data.component)} 
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete additional pay"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        }
        if (params.data.component === 'Total Comp.' && params.data.percentile) {
          return (
            <span className="font-medium">{params.value}</span>
          );
        }
        return <span className={params.data.isSystem ? 'row-section-header' : ''}>{params.value}</span>;
      },
      cellClass: (params: any) => {
        const classes: string[] = [];
        if (params.data.isSystem) classes.push('row-section-header');
        if (!params.data.isSystem && params.data.type === 'additionalPay') classes.push('adjustment-row');
        if (params.data.component === 'Total Comp.') classes.push('row-total');
        return classes.join(' ');
      },
    },
    ...months.map((month) => ({
      field: month.toLowerCase(),
      headerName: month.toUpperCase(),
      flex: 1,
      suppressSizeToFit: false,
      headerClass: 'text-right',
      cellClass: (params: any) => {
        const classes = ['text-right'];
        if (params.value < 0) classes.push('text-red-600');
        if (params.data.component === 'Total Comp.') classes.push('font-semibold');
        return classes.join(' ');
      },
      cellStyle: { textAlign: 'right' },
      valueFormatter: (params: any) => {
        if (params.data.isHeader) return '';
        return formatNegativeCurrency(params.value);
      },
    })) as ColDef[],
    {
      field: 'ytd',
      headerName: 'YTD',
      pinned: 'right' as const,
      width: 110,
      flex: 0,
      suppressSizeToFit: true,
      headerClass: 'text-right',
      cellClass: (params: any) => {
        const classes = ['text-right'];
        if (params.value < 0) classes.push('text-red-600');
        if (params.data.component === 'Total Comp.') classes.push('font-semibold');
        return classes.join(' ');
      },
      valueFormatter: (params: any) => formatNegativeCurrency(params.value),
      lockPinned: true,
      lockPosition: true,
      suppressMovable: true
    }
  ];

  const handleExportPDF=async()=>{
    const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
    
    setIsGaugesVisible(true);
    setIsWRVUChartVisible(true);
    setIsMetricsTableVisible(true);
    setIsCompTableVisible(true);
    
    await new Promise(resolve=>setTimeout(resolve,100));

    try{
      const headerSection=document.querySelector('.dashboard-header');
      const summaryCards=document.querySelector('.summary-cards');
      const performanceMetrics=document.querySelector('.performance-metrics');

      const addSection=async(pdf:jsPDF,element:HTMLElement|null,x:number,y:number,scale:number)=>{
        if(!element)return y;
        const canvas=await html2canvas(element,{
          scale:2,logging:false,useCORS:true,allowTaint:true,backgroundColor:'#ffffff'
        });
        const imgData=canvas.toDataURL('image/png');
        const imgWidth=canvas.width*scale;
        const imgHeight=canvas.height*scale;
        pdf.addImage(imgData,'PNG',x,y,imgWidth,imgHeight);
        return y+imgHeight;
      };

      pdf.setFontSize(24);
      pdf.setTextColor(0,0,0);
      let currentY=40;
      currentY=await addSection(pdf,headerSection as HTMLElement,40,currentY,0.8)||currentY;
      currentY=await addSection(pdf,summaryCards as HTMLElement,40,currentY+40,0.8)||currentY;
      currentY=await addSection(pdf,performanceMetrics as HTMLElement,40,currentY+40,0.8)||currentY;

      pdf.addPage();
      const wrvuChart=document.getElementById('wrvu-chart-section');
      await addSection(pdf,wrvuChart as HTMLElement,40,40,0.8);

      pdf.addPage();
      const metricsTable=document.getElementById('metrics-table');
      await addSection(pdf,metricsTable as HTMLElement,40,40,0.75);
      
      const compensationTable=document.getElementById('compensation-table');
      await addSection(pdf,compensationTable as HTMLElement,40,400,0.75);

      pdf.save(`${provider.firstName}_${provider.lastName}_Dashboard.pdf`);

    }catch(error){
      console.error('Error generating PDF:',error);
    }finally{
      setIsGaugesVisible(false);
      setIsWRVUChartVisible(false);
      setIsMetricsTableVisible(false);
      setIsCompTableVisible(false);
    }
  };

  useEffect(()=>{
    const styleSheet=document.createElement('style');
    styleSheet.innerText=`
      .ag-cell-vertically-aligned {
        line-height:48px!important;
        padding-top:0!important;
        padding-bottom:0!important;
      }
      .ag-header-cell-right .ag-header-cell-label {
        justify-content:flex-end;
        padding-right:16px;
      }
    `;
    document.head.appendChild(styleSheet);
    return()=>{
      document.head.removeChild(styleSheet);
    };
  },[]);

  const onMetricsGridReady = (params: GridReadyEvent) => {
    setMetricsGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  const onCompensationGridReady = (params: GridReadyEvent) => {
    setCompensationGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  const currentProgress = useMemo(() => calculateYTDTargetProgress(getRowData()).percentage, [getRowData]);

  const getStatusIndicator = (progress: number) => {
    if (progress >= 90) return { class: 'bg-emerald-400/10 text-emerald-400', text: 'Exceptional' };
    if (progress >= 70) return { class: 'bg-green-400/10 text-green-400', text: 'On Track' };
    if (progress >= 40) return { class: 'bg-amber-400/10 text-amber-400', text: 'Needs Attention' };
    return { class: 'bg-red-400/10 text-red-400', text: 'Below Target' };
  };

  const calculateTotalCompPercentile = (totalComp: number, marketData: MarketData[]): { percentile: number, nearestBenchmark: string } => {
    const matchingMarket = marketData.find(data => data.specialty === provider.specialty);
    if (!matchingMarket) return { percentile: 0, nearestBenchmark: 'Unknown' };

    const benchmarks = [
      { percentile: 25, value: matchingMarket.p25_total },
      { percentile: 50, value: matchingMarket.p50_total },
      { percentile: 75, value: matchingMarket.p75_total },
      { percentile: 90, value: matchingMarket.p90_total }
    ];

    // If below 25th percentile
    if (totalComp < benchmarks[0].value) {
      const percentile = (totalComp / benchmarks[0].value) * 25;
      return { percentile, nearestBenchmark: '< 25th' };
    }

    // If above 90th percentile
    if (totalComp > benchmarks[3].value) {
      const percentile = 90 + ((totalComp - benchmarks[3].value) / benchmarks[3].value) * 10;
      return { percentile: Math.min(100, percentile), nearestBenchmark: '> 90th' };
    }

    // Find which benchmarks we're between
    for (let i = 0; i < benchmarks.length - 1; i++) {
      const lower = benchmarks[i];
      const upper = benchmarks[i + 1];
      if (totalComp >= lower.value && totalComp <= upper.value) {
        const range = upper.value - lower.value;
        const position = totalComp - lower.value;
        const percentileRange = upper.percentile - lower.percentile;
        const percentile = lower.percentile + (position / range) * percentileRange;
        return { 
          percentile,
          nearestBenchmark: `${lower.percentile}th-${upper.percentile}th`
        };
      }
    }

    return { percentile: 0, nearestBenchmark: 'Unknown' };
  };

  useEffect(() => {
    // Initialize state with provider data
    setAnnualSalary(provider.baseSalary);
    setFte(provider.fte);
  }, [provider]);

  useEffect(() => {
    // Fetch all providers for the selector
    async function fetchAllProviders() {
      try {
        const response = await fetch('/api/providers');
        const data = await response.json();
        if (response.ok) {
          setProviders(data.providers);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    }
    fetchAllProviders();
  }, []);

  useEffect(() => {
    const fetchAdjustments = async () => {
      try {
        // Fetch wRVU adjustments
        const wrvuResponse = await fetch(`/api/wrvu-adjustments?providerId=${provider.id}`);
        if (wrvuResponse.ok) {
          const wrvuData = await wrvuResponse.json();
          if (wrvuData.success) {
            setAdjustments(wrvuData.data);
          }
        }

        // Fetch target adjustments
        const targetResponse = await fetch(`/api/target-adjustments?providerId=${provider.id}`);
        if (targetResponse.ok) {
          const targetData = await targetResponse.json();
          if (targetData.success) {
            setTargetAdjustments(targetData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching adjustments:', error);
      }
    };

    fetchAdjustments();
  }, [provider.id]);

  return (
    <>
      <div className="w-full">
        <style>{customStyles}</style>
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/admin/providers" 
            className="group flex items-center"
            title="Back to Providers"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-blue-500 hover:bg-blue-600 transition-colors">
              <ChevronLeftIcon className="h-6 w-6 text-white" aria-hidden={true} />
            </div>
            <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Back to Providers</span>
          </Link>
          <div className="relative">
            <button
              onClick={() => setIsProviderSelectorOpen(!isProviderSelectorOpen)}
              className="w-[220px] inline-flex items-center justify-between px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Switch Provider
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isProviderSelectorOpen && (
              <div className="absolute right-0 z-10 mt-2 w-[220px] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-96 overflow-y-auto py-1">
                  {filteredProviders.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setIsProviderSelectorOpen(false);
                        setSearchTerm('');
                        router.push(`/provider/${p.employeeId}`);
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        p.id === provider.id ? 'bg-gray-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {p.firstName} {p.lastName} ({p.employeeId})
                    </button>
                  ))}
                  {filteredProviders.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No providers found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="dashboard-header bg-white rounded-lg shadow-sm mb-8 border border-gray-200">
          <div className="px-8 py-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {provider.firstName} {provider.lastName}, {provider.suffix || 'MD'}
              </h1>
              <div className="text-base font-medium text-gray-600 mb-3">
                {provider.specialty}
              </div>
              <div className="flex items-center gap-4 text-gray-500 text-sm">
                <span className="flex items-center">
                  ID: {provider.employeeId}
                </span>
                <span className="flex items-center">
                  FTE: {fte.toFixed(2)}
                </span>
                <span className="flex items-center">
                  Comp Type: {provider.compensationModel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="bg-blue-50 rounded-lg p-2 mr-3">
                    <BanknotesIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Base Salary</h3>
                </div>
                <p className="mt-3 text-xl font-semibold text-gray-900">{formatCurrency(provider.baseSalary)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="bg-blue-50 rounded-lg p-2 mr-3">
                    <ChartPieIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">YTD wRVUs</h3>
                </div>
                <p className="mt-3 text-xl font-semibold text-gray-900">{formatNumber(ytdWRVUs)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="bg-blue-50 rounded-lg p-2 mr-3">
                    <ScaleIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Conversion Factor</h3>
                </div>
                <p className="mt-3 text-xl font-semibold text-gray-900">{formatCurrency(getConversionFactor())}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="bg-blue-50 rounded-lg p-2 mr-3">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Incentives Earned</h3>
                </div>
                <p className="mt-3 text-xl font-semibold text-gray-900">{formatCurrency(totalIncentives)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="bg-blue-50 rounded-lg p-2 mr-3">
                    <ArrowPathIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Holdback</h3>
                </div>
                <p className="mt-3 text-xl font-semibold text-gray-900">
                  {formatCurrency(Math.abs(getCompensationData()
                    .find(row => row.component === 'Holdback (20%)')?.ytd || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-8">
          <nav className="flex justify-center -mb-px space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveView('compensation')}
              className={`
                inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
                ${activeView === 'compensation' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                transition-colors duration-200
              `}
            >
              <CurrencyDollarIcon className="h-5 w-5" />
              wRVUs & Compensation
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`
                inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
                ${activeView === 'analytics' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                transition-colors duration-200
              `}
            >
              <ChartBarIcon className="h-5 w-5" />
              Analytics & Charts
            </button>
            <button
              onClick={() => setActiveView('control')}
              className={`
                inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
                ${activeView === 'control' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                transition-colors duration-200
              `}
            >
              <Cog6ToothIcon className="h-5 w-5" />
              Settings & Controls
            </button>
          </nav>
        </div>

        <div className="transition-all duration-300 ease-in-out">
          {activeView === 'compensation' && (
            <div className="space-y-6">
              <div id="metrics-table" className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Metrics & Adjustments</h2>
                </div>
                <div className="p-6">
                  <div className="flex gap-3 mb-6">
                    <button 
                      onClick={() => handleOpenAdjustmentModal('wrvu')} 
                      className="inline-flex items-center px-6 py-2.5 bg-blue-600 rounded-full text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add wRVU Adjustment
                    </button>
                    <button 
                      onClick={() => handleOpenAdjustmentModal('target')} 
                      className="inline-flex items-center px-6 py-2.5 bg-blue-600 rounded-full text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Target Adjustment
                    </button>
                  </div>
                  <div className="ag-theme-alpine w-full">
                    <AgGridReact
                      domLayout="autoHeight"
                      rowHeight={40}
                      headerHeight={40}
                      defaultColDef={{
                        resizable: true,
                        sortable: false,
                        suppressMenu: true,
                        flex: 1,
                        minWidth: 82
                      }}
                      columnDefs={metricsColumnDefs}
                      rowData={getRowData()}
                      onGridReady={onMetricsGridReady}
                    />
                  </div>
                </div>
              </div>

              <div id="compensation-table" className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Compensation Details</h2>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <button 
                      onClick={() => handleOpenAdjustmentModal('additionalPay')} 
                      className="inline-flex items-center px-6 py-2.5 bg-blue-600 rounded-full text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Additional Pay
                    </button>
                    {(() => {
                      const ytdTotal = getCompensationData().find(row => row.component === 'Total Comp.')?.ytd || 0;
                      const { percentile } = calculateTotalCompPercentile(ytdTotal, marketData);
                      return (
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-200">
                          <div className="text-sm">
                            <span className="text-gray-500">Total Comp. Percentile:</span>
                            <span className="ml-2 font-semibold text-gray-900">{percentile.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="ag-theme-alpine w-full">
                    <AgGridReact
                      context={{ monthlyDetails }}
                      domLayout="autoHeight"
                      rowHeight={40}
                      headerHeight={40}
                      defaultColDef={{
                        resizable: true,
                        sortable: false,
                        suppressMenu: true,
                        flex: 1,
                        minWidth: 82
                      }}
                      columnDefs={compensationColumnDefs}
                      rowData={getCompensationData()}
                      onGridReady={onCompensationGridReady}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Performance Metrics
                    </h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full text-sm">
                      <span className="text-gray-400">Current:</span>
                      <span className="font-medium text-white">{currentProgress.toFixed(1)}%</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusIndicator(currentProgress).class}`}>
                        {getStatusIndicator(currentProgress).text}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <WRVUGauge
                        title="Plan Year Progress"
                        value={calculatePlanYearProgress(getRowData()).percentage}
                        subtitle={`${calculatePlanYearProgress(getRowData()).completed} of ${calculatePlanYearProgress(getRowData()).total} months`}
                        size="large"
                        showTrend={true}
                      />
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Last updated:</span>
                          <span className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <WRVUGauge
                        title="Target Progress"
                        value={calculateYTDTargetProgress(getRowData()).percentage}
                        subtitle={`${formatNumber(calculateYTDTargetProgress(getRowData()).actual)} of ${formatNumber(calculateYTDTargetProgress(getRowData()).target)}`}
                        size="large"
                        showTrend={true}
                      />
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">YTD Progress</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {calculateYTDTargetProgress(getRowData()).percentage.toFixed(1)}%
                            </span>
                            <span className="text-xs text-emerald-500">↑</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <WRVUGauge
                        title="Incentive % of Base"
                        value={(totalIncentives / provider.baseSalary) * 100}
                        subtitle={`${formatCurrency(totalIncentives)} of ${formatCurrency(provider.baseSalary)}`}
                        size="large"
                        showTrend={true}
                      />
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">YTD Incentives</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(totalIncentives)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900 mb-1">Performance Summary</h4>
                          <p className="text-sm text-blue-700 leading-relaxed">
                            Your YTD wRVU production is at {calculateYTDTargetProgress(getRowData()).percentage.toFixed(1)}% of target. 
                            {calculateYTDTargetProgress(getRowData()).percentage >= 100 
                              ? ' You are exceeding your target!' 
                              : ' Keep pushing to reach your target.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden" id="wrvu-chart-section">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">wRVU Performance</h2>
                </div>
                <div className="p-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <WRVUChart
                      actualWRVUs={getRowData().find(row=>row.metric==='Total wRVUs')?months.map(m=>getRowData().find(r=>r.metric==='Total wRVUs')?.[m.toLowerCase()]||0):[]}
                      targetWRVUs={getRowData().find(row=>row.metric==='Total Target')?months.map(m=>getRowData().find(r=>r.metric==='Total Target')?.[m.toLowerCase()]||0):[]}
                      months={months}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView==='control'&&(
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium">Compensation Management</h2>
                </div>
                <div className="p-6">
                  {/* Holdback and Actions Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-4 flex-1">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Holdback:
                        </label>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={holdbackPercentage}
                            onChange={(e) => setHoldbackPercentage(Number(e.target.value))}
                            className="w-full"
                          />
                          <span className="text-sm font-medium text-gray-900 min-w-[2rem]">
                            {holdbackPercentage}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={()=>handleOpenAdjustmentModal('additionalPay')}
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                        >
                          <PlusIcon className="h-4 w-4 mr-1"/>
                          Additional Pay
                        </button>
                        <button
                          onClick={()=>handleOpenAdjustmentModal('wrvu')}
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                        >
                          <PlusIcon className="h-4 w-4 mr-1"/>
                          wRVU Adjustment
                        </button>
                        <button
                          onClick={()=>handleOpenAdjustmentModal('target')}
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                        >
                          <PlusIcon className="h-4 w-4 mr-1"/>
                          Target Adjustment
                        </button>
                        <button
                          onClick={handleOpenCompChangeModal}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          <CurrencyDollarIcon className="h-4 w-4 mr-1"/>
                          Record Change
                        </button>
                      </div>
                    </div>
                  </div>

                  <CompensationHistory
                    changes={compensationHistory}
                    onDelete={(id)=>setCompensationHistory(prev=>prev.filter(change=>change.id!==id))}
                    onEdit={handleEditCompensationChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setIsEditing(false);
          setEditingWRVUAdjustment(null);
          setEditingTargetAdjustment(null);
        }}
        onAdd={handleAddAdjustment}
        type={adjustmentType}
        editingData={adjustmentType === 'wrvu' ? editingWRVUAdjustment : editingTargetAdjustment}
        isEditing={isEditing}
      />

      <CompensationChangeModalComponent
        isOpen={isCompChangeModalOpen}
        onClose={handleCloseCompChangeModal}
        currentSalary={provider.baseSalary}
        currentFTE={provider.fte}
        conversionFactor={getConversionFactor()}
        onSave={handleCompensationChange}
        editingData={editingChangeId ? compensationHistory.find(c => c.id === editingChangeId) : undefined}
      />
    </>
  );
}
