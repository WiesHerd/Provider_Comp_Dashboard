'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AddAdjustmentModal from './AddAdjustmentModal';
import WRVUChart from './WRVUChart';
import WRVUGauge from './WRVUGauge';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  Cog6ToothIcon, 
  BanknotesIcon, 
  ChartPieIcon, 
  ScaleIcon, 
  ArrowTrendingUpIcon, 
  ArrowPathIcon, 
  ArrowDownTrayIcon, 
  InformationCircleIcon, 
  DocumentTextIcon, 
  ChevronDownIcon, 
  ArrowLeftIcon, 
  ChevronLeftIcon 
} from '@heroicons/react/24/outline';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CompensationHistory from './CompensationHistory';
import CompensationChangeModalComponent from './CompensationChangeModal';
import { CompensationChange } from '@/types/compensation';
import { 
  Provider, 
  MarketData, 
  CompensationModel, 
  MonthlyDetail,
  Benchmark,
  TierConfig as DashboardTierConfig,
  Tier as DashboardTier,
  GridRowStyle
} from '@/types/dashboard';
import { 
  ColDef, 
  GridApi, 
  GridReadyEvent,
  GetRowIdParams,
  ValueSetterParams,
  CellClickedEvent,
  RowClassParams
} from 'ag-grid-community';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createWRVUAdjustment, deleteWRVUAdjustment } from '@/services/wrvu-adjustment';
import { createTargetAdjustment, deleteTargetAdjustment } from '@/services/target-adjustment';
import { getAdditionalPay, createAdditionalPay, updateAdditionalPay, deleteAdditionalPay } from '@/services/additional-pay';
import { useToast } from '@/components/ui/use-toast';
import type { WRVUAdjustment, TargetAdjustment } from '@/types';
import type { AdditionalPay, AdditionalPayFormData, MonthlyValues } from '@/types/additional-pay';
import AdditionalPayModal from '@/components/AdditionalPay/AdditionalPayModal';
import { PrismaClient } from '@prisma/client';
import { toast } from 'sonner';
import { CompensationPlanFactory } from '@/lib/compensation-plans/CompensationPlanFactory';
import { BaseCompensationPlan } from '@/lib/compensation-plans/BaseCompensationPlan';
import { CompensationRowData } from '@/types/dashboard';

const prisma = new PrismaClient();

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
      monthlySalaries[monthKey] = currentAnnualSalary / 12;
      monthlyDetails[monthKey] = { 
        month: monthKey,
        value: currentAnnualSalary / 12,
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
      // Entire month at new salary
      monthlySalaries[monthKey] = newAnnual / 12;
      monthlyDetails[monthKey] = {
        month: monthKey,
        value: newAnnual / 12,
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
      
      const oldMonthlyAmount = (oldAnnual / 12) * (oldDays / daysInMonth);
      const newMonthlyAmount = (newAnnual / 12) * (newDays / daysInMonth);
      const monthlyTotal = oldMonthlyAmount + newMonthlyAmount;

      monthlySalaries[monthKey] = monthlyTotal;
      monthlyDetails[monthKey] = {
        month: monthKey,
        value: monthlyTotal,
        changed: true,
        prorated: true,
        oldAnnual,
        newAnnual,
        oldFTE,
        newFTE,
        oldDays,
        newDays,
        oldMonthly: oldMonthlyAmount,
        newMonthly: newMonthlyAmount
      };
    }

    // Update current values for future months
    currentAnnualSalary = newAnnual;
    currentFTE = newFTE;
  }

  return { monthlySalaries, monthlyDetails };
}

function calculateMonthlyTarget(salaries: Record<string, number>, conversionFactor: number) {
  const result: Record<string, number> = {};
  months.forEach(m => {
    const monthKey = m.toLowerCase();
    result[monthKey] = conversionFactor > 0 ? Number(salaries[monthKey] || 0) / conversionFactor : 0;
  });
  return result;
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
      previousSalary: currentSalary,
      newSalary,
      previousFTE: currentFTE,
      newFTE,
      previousConversionFactor: conversionFactor,
      newConversionFactor: conversionFactor,
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

// Add a NoDataMessage component at the top of the file
const NoDataMessage = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
    <div className="text-gray-400 mb-2">
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">No Data Available</h3>
    <p className="text-gray-500 text-center">{message}</p>
  </div>
);

// Add these interfaces after the existing interfaces

interface MetricRow {
  component: string;
  values?: number[];
  [key: string]: any;
}

interface CompensationRow {
  component: string;
  isSystem?: boolean;
  isHeader?: boolean;
  ytd: number;
  [key: string]: any;
}

interface MonthlyMetric {
  month: number;
  targetWRVUs: number;
  cumulativeTarget: number;
  actualWRVUs: number;
  cumulativeWRVUs: number;
  baseSalary: number;
  totalCompensation: number;
}

// Add these interfaces near the top with other interfaces
interface Tier {
  threshold: number;
  conversionFactor: number;
}

interface TierConfig {
  id: string;
  name: string;
  tiers: Tier[];
}

// Add this function before getMonthlyIncentive
const calculateTieredConversionFactor = (percentile: number, tiers: Tier[]): number => {
  if (!tiers || tiers.length === 0) return 0;
  
  // Sort tiers by threshold ascending
  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
  
  // Find the highest tier that the provider has reached
  let applicableTier = sortedTiers[0]; // Default to first tier
  
  for (const tier of sortedTiers) {
    if (percentile >= tier.threshold) {
      applicableTier = tier;
    } else {
      break;
    }
  }
  
  return applicableTier.conversionFactor;
};

const calculateWRVUPercentile = (
  actualWRVUs: number,
  monthsCompleted: number,
  fte: number,
  marketData: MarketData | MarketData[],
  specialty: string,
  clinicalFte?: number
): { percentile: number; nearestBenchmark: string } => {
  // Ensure marketData is an array
  const marketDataArray = Array.isArray(marketData) ? marketData : [marketData];
  
  // Find relevant market data for provider's specialty
  const relevantMarketData = marketDataArray.find(data => data.specialty === specialty);
  if (!relevantMarketData) {
    console.warn(`No market data found for specialty: ${specialty}`);
    return { percentile: 0, nearestBenchmark: 'N/A' };
  }

  // Annualize the wRVUs based on completed months
  const annualizedWRVUs = monthsCompleted > 0 
    ? (actualWRVUs / monthsCompleted) * 12 
    : actualWRVUs;

  // Use clinical FTE if provided, otherwise use total FTE
  const effectiveFTE = clinicalFte || fte;
  
  // Adjust for FTE if less than 1.0
  const fteAdjustedWRVUs = effectiveFTE < 1.0 
    ? annualizedWRVUs / effectiveFTE 
    : annualizedWRVUs;

  const benchmarks = [
    { percentile: 25, value: relevantMarketData.p25_wrvu || 0 },
    { percentile: 50, value: relevantMarketData.p50_wrvu || 0 },
    { percentile: 75, value: relevantMarketData.p75_wrvu || 0 },
    { percentile: 90, value: relevantMarketData.p90_wrvu || 0 }
  ];

  // If below 25th percentile
  if (fteAdjustedWRVUs < benchmarks[0].value) {
    const percentile = benchmarks[0].value > 0 
      ? (fteAdjustedWRVUs / benchmarks[0].value) * 25 
      : 0;
    return {
      percentile,
      nearestBenchmark: 'Below 25th'
    };
  }

  // If above 90th percentile
  if (fteAdjustedWRVUs > benchmarks[3].value) {
    const extraPercentile = benchmarks[3].value > 0 
      ? ((fteAdjustedWRVUs - benchmarks[3].value) / benchmarks[3].value) * 10 
      : 0;
    const finalPercentile = Math.min(100, 90 + extraPercentile);
    return {
      percentile: finalPercentile,
      nearestBenchmark: 'Above 90th'
    };
  }

  // Find which benchmarks we're between and interpolate
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];
    if (fteAdjustedWRVUs >= lower.value && fteAdjustedWRVUs <= upper.value) {
      const range = upper.value - lower.value;
      const position = fteAdjustedWRVUs - lower.value;
      const percentileRange = upper.percentile - lower.percentile;
      const percentile = range > 0 
        ? lower.percentile + (position / range) * percentileRange 
        : lower.percentile;
      return {
        percentile,
        nearestBenchmark: `${lower.percentile}th-${upper.percentile}th`
      };
    }
  }

  return { percentile: 0, nearestBenchmark: 'N/A' };
};

export default function ProviderDashboard({ provider }: { provider: Provider }) {
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);
  const providerSelectorRef = useRef<HTMLDivElement>(null);
  const [compensationPlan, setCompensationPlan] = useState<BaseCompensationPlan | null>(null);
  const [baseMonthlyData, setBaseMonthlyData] = useState<Record<string, number>>({});
  const [targetMonthlyData, setTargetMonthlyData] = useState<Record<string, number>>({});
  const [marketData, setMarketData] = useState<MarketData[]>([]);

  // Initialize compensation plan
  useEffect(() => {
    if (marketData.length > 0) {
      const plan = CompensationPlanFactory.createPlan(provider, marketData);
      setCompensationPlan(plan);
    }
  }, [provider, marketData]);

  const getMonthlyIncentive = useCallback((month: string): number => {
    if (!compensationPlan) return 0;
    
    const monthKey = month.toLowerCase();
    const monthWRVUs = Number(baseMonthlyData[monthKey]) || 0;
    const monthTarget = targetMonthlyData[monthKey] || 0;
    
    return compensationPlan.calculateMonthlyIncentive(monthWRVUs, monthTarget);
  }, [compensationPlan, baseMonthlyData, targetMonthlyData]);

  const [metricsGridApi, setMetricsGridApi] = useState<GridApi | null>(null);
  const [compensationGridApi, setCompensationGridApi] = useState<GridApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeView, setActiveView] = useState('compensation');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'wrvu' | 'target' | 'additionalPay'>('wrvu');
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [targetAdjustments, setTargetAdjustments] = useState<any[]>([]);
  const [additionalPayments, setAdditionalPayments] = useState<Array<AdditionalPay & MonthlyValues>>([]);
  const [compensationHistory, setCompensationHistory] = useState<CompensationChange[]>([]);
  const [isCompChangeModalOpen, setIsCompChangeModalOpen] = useState(false);
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdditionalPayModalOpen, setIsAdditionalPayModalOpen] = useState(false);
  const [selectedAdditionalPay, setSelectedAdditionalPay] = useState<(AdditionalPay & Partial<MonthlyValues>) | undefined>(undefined);

  const [annualSalary, setAnnualSalary] = useState(provider.baseSalary);
  const [fte, setFte] = useState(provider.fte);

  const [newSalary, setNewSalary] = useState<number>(0);
  const [newFTE, setNewFTE] = useState(1.0);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const [holdbackPercentage, setHoldbackPercentage] = useState(5);

  const [editingWRVUAdjustment, setEditingWRVUAdjustment] = useState<any>(null);
  const [editingTargetAdjustment, setEditingTargetAdjustment] = useState<any>(null);

  // Add new state variables near the top with other states
  const [isMetricsSectionCollapsed, setIsMetricsSectionCollapsed] = useState(false);
  const [isCompensationSectionCollapsed, setIsCompensationSectionCollapsed] = useState(false);

  const { toast } = useToast();  // Add this line near the top of the component

  // Add state for selected providers
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const [selectedTierConfig, setSelectedTierConfig] = useState<any>(null);
  
  // Fetch tier config if provider uses tiered compensation
  useEffect(() => {
    const fetchTierConfig = async () => {
      if (provider.compensationModel === 'Tiered CF' && provider.tieredCFConfigId) {
        try {
          const response = await fetch(`/api/compensation/tier-configs/${provider.tieredCFConfigId}`);
          if (!response.ok) throw new Error('Failed to fetch tier config');
          const config = await response.json();
          setSelectedTierConfig(config);
        } catch (error) {
          console.error('Error fetching tier config:', error);
          toast({
            title: "Error",
            description: "Failed to load tier configuration",
            variant: "destructive"
          });
        }
      }
    };

    fetchTierConfig();
  }, [provider.compensationModel, provider.tieredCFConfigId]);

  const handleProviderSelect = (employeeId: string) => {
    setIsProviderSelectorOpen(false);
    setSearchTerm('');
    router.push(`/provider/${employeeId}`);
  };

  // Add filtered providers based on search
  const filteredProviders = useMemo(() => {
    if (!providers) return [];
    
    return providers.filter(p => 
      `${p.firstName} ${p.lastName} ${p.employeeId} ${p.specialty}`
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

  // Add effect to fetch providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/providers');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch providers: ${response.status} ${response.statusText}. ${errorText}`);
        }
        const data = await response.json();
        // Handle both array and object responses
        const providersList = Array.isArray(data) ? data : data.providers || [];
        setProviders(providersList);
      } catch (error) {
        console.error('Error in fetchProviders:', error);
        setProviders([]); // Set empty array on error
      }
    };

    fetchProviders();
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

  // Update the error handling
  const handleError = (error: unknown) => {
    console.error('Error:', error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      variant: "destructive",
      duration: 5000
    });
  };

  // Update the calculateTotalCompPercentile function
  const calculateTotalCompPercentile = (totalComp: number, marketDataArray: MarketData[]): { percentile: number } => {
    if (!marketDataArray.length) {
      return { percentile: 0 };
    }

    // Find relevant market data for provider's specialty
    const relevantMarketData = marketDataArray.find(data => data.specialty === provider.specialty);
    if (!relevantMarketData) {
      console.warn(`No market data found for specialty: ${provider.specialty}`);
      return { percentile: 0 };
    }

    // Adjust total comp for FTE if less than 1.0
    const fteAdjustedTotalComp = provider.fte < 1.0 ? totalComp / provider.fte : totalComp;

    const benchmarks = [
      { percentile: 25, value: relevantMarketData.p25_total || 0 },
      { percentile: 50, value: relevantMarketData.p50_total || 0 },
      { percentile: 75, value: relevantMarketData.p75_total || 0 },
      { percentile: 90, value: relevantMarketData.p90_total || 0 }
    ];

    console.log('Total Comp Percentile Calculation:', {
      totalComp,
      fte: provider.fte,
      fteAdjustedTotalComp,
      benchmarks,
      specialty: provider.specialty
    });

    // If below 25th percentile
    if (fteAdjustedTotalComp < benchmarks[0].value) {
      const percentile = benchmarks[0].value > 0 ? (fteAdjustedTotalComp / benchmarks[0].value) * 25 : 0;
      console.log(`Below 25th percentile: ${percentile}%`);
      return { percentile };
    }

    // If above 90th percentile
    if (fteAdjustedTotalComp > benchmarks[3].value) {
      const extraPercentile = benchmarks[3].value > 0 
        ? ((fteAdjustedTotalComp - benchmarks[3].value) / benchmarks[3].value) * 10 
        : 0;
      const finalPercentile = Math.min(100, 90 + extraPercentile);
      console.log(`Above 90th percentile: ${finalPercentile}%`);
      return { percentile: finalPercentile };
    }

    // Find which benchmarks we're between and interpolate
    for (let i = 0; i < benchmarks.length - 1; i++) {
      const lower = benchmarks[i];
      const upper = benchmarks[i + 1];
      if (fteAdjustedTotalComp >= lower.value && fteAdjustedTotalComp <= upper.value) {
        const range = upper.value - lower.value;
        const position = fteAdjustedTotalComp - lower.value;
        const percentileRange = upper.percentile - lower.percentile;
        const percentile = range > 0 
          ? lower.percentile + (position / range) * percentileRange 
          : lower.percentile;
        console.log(`Between ${lower.percentile}th and ${upper.percentile}th: ${percentile}%`);
        return { percentile };
      }
    }

    return { percentile: 0 };
  };

  // Update the getConversionFactor function to handle missing market data
  const getConversionFactor = () => {
    if (!marketData || marketData.length === 0) return 0;
    const matchingMarketData = marketData.find(data => data.specialty === provider.specialty);
    return matchingMarketData ? matchingMarketData.p50_cf : 0;
  };

  const { monthlySalaries, monthlyDetails } = useMemo(
    () => getMonthlySalaries(annualSalary, fte, compensationHistory),
    [annualSalary, fte, compensationHistory]
  );

  const calculatedTargetData = useMemo(() => {
    const salariesRecord = months.reduce((acc, month) => {
      acc[month.toLowerCase()] = Number(monthlySalaries[month.toLowerCase()] || 0);
      return acc as Record<string, number>;
    }, {} as Record<string, number>);
    
    return calculateMonthlyTarget(salariesRecord, getConversionFactor());
  }, [monthlySalaries, getConversionFactor]);

  const totalWRVUs = useMemo(() => {
    if (isLoading) return Object.fromEntries(months.map((m) => [m.toLowerCase(), 0]));
    return calculateTotalWRVUs(baseMonthlyData, adjustments);
  }, [baseMonthlyData, adjustments, isLoading]);

  const totalTargetsWithAdjustments = useMemo(() => calculateTotalTargets(calculatedTargetData, targetAdjustments), [calculatedTargetData, targetAdjustments]);
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
    const wrvuYTD = calculateYTD(baseMonthlyData || {}, adjustments || []);
    const targetYTD = calculateYTD(calculatedTargetData || {}, targetAdjustments || []);
    const varianceYTD = wrvuYTD - targetYTD;

    // Calculate months with data for annualization
    const monthsWithData = months.reduce((count, m) => 
      ((baseMonthlyData || {})[m.toLowerCase()] > 0 ? count + 1 : count), 0);

    // Calculate wRVU percentile
    const relevantMarketData = marketData.find(m => m.specialty === provider.specialty);
    const wrvuPercentileResult = calculateWRVUPercentile(
      totalWRVUs.ytd || 0,
      monthsWithData,
      provider.fte,
      marketData || [],
      provider.specialty,
      provider.clinicalFte
    );

    return [
      { metric: 'wRVU Generation', isHeader: true, section: 'generation' },
      { 
        metric: 'Actual wRVUs', 
        ...(baseMonthlyData || {}), 
        ytd: calculateYTD(baseMonthlyData || {}, []), 
        section: 'generation'
      },
      ...(adjustments || []).map(adj => ({
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
      { metric: 'Target wRVUs', ...calculatedTargetData, ytd: calculateYTD(calculatedTargetData || {}, []), section: 'target' },
      ...(targetAdjustments || []).map(adj => ({
        metric: adj.name,
        ...adj,
        type: 'target',
        isAdjustment: true,
        editable: true,
        ytd: calculateYTD(adj, []),
        section: 'target'
      })),
      { metric: 'Total Target', ...totalTargetsWithAdjustments, ytd: calculateYTD(calculatedTargetData || {}, targetAdjustments || []), section: 'target' },
      { metric: 'Variance', ...monthlyVariances, ytd: varianceYTD }
    ];
  }, [adjustments, targetAdjustments, totalWRVUs, totalTargetsWithAdjustments, monthlyVariances, calculatedTargetData, provider.fte, marketData, provider.clinicalFte]);

  // Add the handler functions
  const handleEditProvider = (providerId: string) => {
    // Implement edit functionality
    console.log('Edit provider:', providerId);
  };

  const handleDeleteProvider = (providerId: string) => {
    // Implement delete functionality
    console.log('Delete provider:', providerId);
  };

  const handleExportToExcel = () => {
    // Implement export functionality
    console.log('Export to Excel');
  };

  const monthToNumber: { [key: string]: number } = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
  };

  // Update the saveMetricsAndAnalytics function
  const saveMetricsAndAnalytics = async (provider: Provider, rowData: MetricRow[], compensationData: CompensationRowData[]) => {
    try {
      if (!provider || !rowData || !compensationData) {
        console.warn('Missing required data for metrics sync');
        return;
      }

      const currentYear = new Date().getFullYear();
      let cumulativeTarget = 0;
      let cumulativeWRVUs = 0;

      // Get the total compensation data first
      const totalCompRow = compensationData.find(row => row.component === 'Total Comp.');
      const baseSalaryRow = compensationData.find(row => row.component === 'Base Salary');
      const actualRow = rowData.find(row => row.metric === 'Total wRVUs');
      const totalTarget = rowData.find(row => row.metric === 'Total Target');

      if (!totalCompRow || !baseSalaryRow || !actualRow || !totalTarget) {
        console.warn('Missing required rows for metrics sync');
        return;
      }

      // Calculate monthly targets and actuals
      const monthlyTargets = months.map((_, index) => {
        const monthNumber = index + 1;
        const monthKey = months[index].toLowerCase();
        
        // Get actual wRVUs for the month
        const actualWRVUs = actualRow[monthKey] ? Number(actualRow[monthKey]) : 0;
        cumulativeWRVUs += actualWRVUs;

        // Get target for the month
        const monthlyTarget = totalTarget[monthKey] ? Number(totalTarget[monthKey]) : 0;
        cumulativeTarget += monthlyTarget;

        // Get total compensation for the month
        const monthlyTotalComp = totalCompRow[monthKey] ? Number(totalCompRow[monthKey]) : 0;
        const monthlyBaseSalary = baseSalaryRow[monthKey] ? Number(baseSalaryRow[monthKey]) : 0;

        // Calculate YTD compensation up to this month
        const ytdCompensation = months
          .slice(0, monthNumber)
          .reduce((sum, m) => sum + (Number(totalCompRow[m.toLowerCase()]) || 0), 0);

        // Calculate wRVU percentile using clinical FTE
        const { percentile: wrvuPercentile } = calculateWRVUPercentile(
          cumulativeWRVUs,
          monthNumber,
          provider.fte,
          marketData || [],
          provider.specialty,
          provider.clinicalFte
        );

        // Calculate comp percentile using total FTE and annualized compensation
        const annualizedCompensation = monthNumber > 0 ? (ytdCompensation / monthNumber) * 12 : 0;
        const { percentile: compPercentile } = calculateTotalCompPercentile(
          annualizedCompensation,
          marketData || []
        );

        // Calculate plan progress
        const planProgress = monthlyTarget > 0 ? (actualWRVUs / monthlyTarget) * 100 : 0;

        return {
          month: monthNumber,
          targetWRVUs: monthlyTarget,
          cumulativeTarget,
          actualWRVUs,
          cumulativeWRVUs,
          baseSalary: monthlyBaseSalary,
          totalCompensation: monthlyTotalComp,
          wrvuPercentile,
          compPercentile,
          planProgress
        };
      });

      // Call the API to sync metrics
      const response = await fetch('/api/metrics/sync-provider-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: provider.id,
          year: currentYear,
          metrics: monthlyTargets
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Failed to sync metrics:', errorData);
        return;
      }

      const result = await response.json();
      console.log('Successfully updated metrics:', result);

    } catch (error) {
      console.warn('Error in saveMetricsAndAnalytics:', error);
      // Don't throw the error, just log it to prevent UI disruption
    }
  };

  // Add sync points to key data changes
  useEffect(() => {
    if (!isLoading && baseMonthlyData && Object.keys(baseMonthlyData).length > 0) {
      const rowData = getRowData();
      const compensationData = getCompensationData();
      saveMetricsAndAnalytics(provider, rowData, compensationData);
    }
  }, [baseMonthlyData, adjustments, targetAdjustments, additionalPayments, compensationHistory]);

  const handleAddAdditionalPay = async (data: AdditionalPayFormData) => {
    try {
      const response = await createAdditionalPay(data);
      if (response.success && response.data) {
        setAdditionalPayments(prev => [...prev, response.data as AdditionalPay & MonthlyValues]);
        setIsAdditionalPayModalOpen(false);
        toast({
          title: "Success",
          description: "Additional pay added successfully",
          variant: "default"
        } as const);
      }
    } catch (error) {
      console.error('Error adding additional pay:', error);
      toast({
        title: "Error",
        description: "Failed to add additional pay",
        variant: "destructive"
      });
    }
  };

  const handleEditAdditionalPay = (additionalPay: AdditionalPay & MonthlyValues) => {
    setSelectedAdditionalPay(additionalPay);
    setIsAdditionalPayModalOpen(true);
  };

  const handleUpdateAdditionalPay = async (data: AdditionalPayFormData) => {
    try {
      if (!selectedAdditionalPay?.id) {
        console.error('No selected additional pay ID');
        return;
      }

      console.log('Updating additional pay:', { id: selectedAdditionalPay.id, data });
      const updatedPay = await updateAdditionalPay(selectedAdditionalPay.id, data);
      console.log('Update successful:', updatedPay);

      // If we get here, the update was successful even if updatedPay is empty
      // Refresh the data to get the latest state
      const year = new Date().getFullYear();
      const response = await getAdditionalPay(provider.id, year);
      if (response.success && Array.isArray(response.data)) {
        setAdditionalPayments(response.data);
      }

      // Close the modal and clear selection
      setIsAdditionalPayModalOpen(false);
      setSelectedAdditionalPay(undefined);
    } catch (error) {
      console.error('Failed to update additional pay:', error);
      // Show error message to user
      alert(error instanceof Error ? error.message : 'Failed to update additional pay. Please try again.');
    }
  };

  const handleRemoveAdditionalPay = async (id: string) => {
    try {
      const response = await deleteAdditionalPay(id);
      if (response.success) {
        setAdditionalPayments(prev => prev.filter(item => item.id !== id));
        toast({
          title: "Success",
          description: "Additional pay removed successfully",
          variant: "default"
        } as const);
      }
    } catch (error) {
      console.error('Error removing additional pay:', error);
      toast({
        title: "Error",
        description: "Failed to remove additional pay",
        variant: "destructive"
      });
    }
  };

  const getRowStyle = (params: RowClassParams): { [key: string]: string | number } | undefined => {
    if (params.node.rowIndex === params.api.getDisplayedRowCount() - 1) {
      return { borderBottom: '1px solid #e2e8f0' };
    }
    return undefined;
  };

  const getCompensationData = (): CompensationRowData[] => {
    if (!compensationPlan) {
      return [{
        component: 'Base Salary',
        isSystem: true,
        ...monthlySalaries,
        ytd: Object.values(monthlySalaries).reduce((sum: number, val) => sum + (Number(val) || 0), 0),
      }];
    }

    // Start with base salary for all models
    const baseData: CompensationRowData[] = [
      {
        component: 'Base Salary',
        isSystem: true,
        ...monthlySalaries,
        ytd: Object.values(monthlySalaries).reduce((sum: number, val) => sum + (Number(val) || 0), 0),
      }
    ];

    // Only add incentive sections for non-Base Pay models
    if (compensationPlan.getName() !== 'Base Pay') {
      // Add incentives section
      const incentivesData: CompensationRowData = {
        component: 'Incentives',
        isSystem: true,
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: getMonthlyIncentive(month)
        }), {}),
        ytd: 0
      };
      incentivesData.ytd = months.reduce((sum, month) => sum + (incentivesData[month.toLowerCase()] || 0), 0);
      baseData.push(incentivesData);

      // Add holdback section
      const holdbackData: CompensationRowData = {
        component: `Holdback (${holdbackPercentage}%)`,
        isSystem: true,
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: compensationPlan.calculateHoldback(incentivesData[month.toLowerCase()] || 0)
        }), {}),
        ytd: 0
      };
      holdbackData.ytd = months.reduce((sum, month) => sum + (holdbackData[month.toLowerCase()] || 0), 0);
      baseData.push(holdbackData);
    }

    // Add additional payments if any
    if (additionalPayments.length > 0) {
      baseData.push({
        component: 'Other Compensation',
        isSystem: true,
        isHeader: true,
        ...months.reduce((acc, month) => ({ ...acc, [month.toLowerCase()]: 0 }), {}),
        ytd: 0
      });

      additionalPayments.forEach(payment => {
        baseData.push({
          ...payment,
          component: payment.name,
          isSystem: false,
          type: 'additionalPay',
          ytd: months.reduce((sum, month) => sum + (Number(payment[month.toLowerCase()]) || 0), 0)
        });
      });
    }

    // Calculate total compensation
    const totalRow: CompensationRowData = {
      component: 'Total Comp.',
      isSystem: true,
      ...months.reduce((acc, month) => {
        const monthKey = month.toLowerCase();
        const total = baseData.reduce((sum, row) => {
          if (row.isHeader) return sum;
          return sum + (Number(row[monthKey]) || 0);
        }, 0);
        return { ...acc, [monthKey]: total };
      }, {}),
      ytd: 0
    };
    totalRow.ytd = months.reduce((sum, month) => sum + (totalRow[month.toLowerCase()] || 0), 0);
    totalRow.percentile = calculateTotalCompPercentile(totalRow.ytd, marketData).percentile;

    baseData.push(totalRow);
    return baseData;
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

        console.log('Sending wRVU adjustment data:', JSON.stringify(adjustmentData, null, 2));
        
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
          name: data.name || editingTargetAdjustment?.name || '',
          description: data.description || editingTargetAdjustment?.description || '',
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
          let apiResponse;
          if (isEditing && editingTargetAdjustment?.id) {
            // Update existing adjustment
            apiResponse = await fetch(`/api/target-adjustments/${editingTargetAdjustment.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(adjustmentData)
            }).then(res => res.json());
          } else {
            // Create new adjustment
            apiResponse = await createTargetAdjustment(adjustmentData);
          }

          console.log('API Response:', JSON.stringify(apiResponse, null, 2));

          if (!apiResponse.success) {
            console.error('Failed to save target adjustment:', apiResponse.error);
            return;
          }

          // Update local state
          if (isEditing) {
            setTargetAdjustments(prev => prev.map(adj => 
              adj.id === editingTargetAdjustment?.id ? apiResponse.data : adj
            ));
          } else {
            setTargetAdjustments(prev => [...prev, apiResponse.data]);
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
        monthlyValues: {
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
        }
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
        monthlyValues: {
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
        }
      };
      setEditingTargetAdjustment(targetAdjustment);
      setAdjustmentType('target');
      setIsEditing(true);
      setIsAdjustmentModalOpen(true);
    }
  };

  const handleRemoveAdjustment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this wRVU adjustment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteWRVUAdjustment(id);
      if (response.success) {
        setAdjustments(prev => prev.filter(adj => adj.id !== id));
        toast({
          title: "Success",
          description: "wRVU adjustment deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete wRVU adjustment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting wRVU adjustment:', error);
      toast({
        title: "Error",
        description: "Failed to delete wRVU adjustment",
        variant: "destructive"
      });
    }
  };

  const handleRemoveTargetAdjustment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this target adjustment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteTargetAdjustment(id);
      if (response.success) {
        setTargetAdjustments(prev => prev.filter(adj => adj.id !== id));
        toast({
          title: "Success",
          description: "Target adjustment deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete target adjustment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting target adjustment:', error);
      toast({
        title: "Error",
        description: "Failed to delete target adjustment",
        variant: "destructive"
      });
    }
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
    compensationModel?: string;
    tieredCFConfigId?: string;
  }) => {
    try {
      // Basic validation for fields required in all cases
      if (!data.effectiveDate || !data.newSalary || !data.newFTE || !data.reason) {
        throw new Error('Missing required fields: effectiveDate, newSalary, newFTE, and reason are required');
      }

      // Ensure all numeric fields are numbers and construct the payload
      const payload = {
        effectiveDate: new Date(data.effectiveDate).toISOString(),
        previousSalary: Number(data.previousSalary),
        newSalary: Number(data.newSalary),
        previousFTE: Number(data.previousFTE),
        newFTE: Number(data.newFTE),
        previousConversionFactor: Number(data.previousConversionFactor || 0),
        newConversionFactor: data.compensationModel === 'Tiered CF' ? 0 : Number(data.newConversionFactor),
        reason: data.reason,
        compensationModel: data.compensationModel || provider.compensationModel,
        tieredCFConfigId: data.tieredCFConfigId
      };

      // Log the payload for debugging
      console.log('Received compensation change data:', data);
      console.log('Sending compensation change request:', payload);

      const response = await fetch(`/api/providers/${provider.employeeId}/compensation-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      console.log('Response status:', response.status);
      console.log('Response content type:', contentType);

      if (!response.ok) {
        let errorMessage = 'Failed to save compensation change';
        let errorDetails = '';
        
        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData?.error || errorMessage;
            errorDetails = JSON.stringify(errorData, null, 2);
          } else {
            errorDetails = await response.text();
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorDetails = 'Could not parse error response';
        }

        console.error('Error details:', errorDetails);
        throw new Error(`${errorMessage}: ${response.status}\nDetails: ${errorDetails}`);
      }

      let savedChange;
      try {
        if (contentType && contentType.includes("application/json")) {
          savedChange = await response.json();
          console.log('Parsed response:', savedChange);
        } else {
          // If no JSON response, create a local object
          savedChange = {
            ...payload,
            id: Date.now().toString(), // Temporary ID
            createdAt: new Date().toISOString()
          };
          console.log('Created local object:', savedChange);
        }
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Failed to parse server response');
      }

      console.log('Saved compensation change:', savedChange);
      setCompensationHistory(prev => [...prev, savedChange]);
      setIsCompChangeModalOpen(false);
      setEditingChangeId(null);
      
      // Show success message
      toast({
        title: "Success",
        description: "Compensation change recorded successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving compensation change:', error);
      // Show error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save compensation change",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleEditCompensationChange = (change: CompensationChange) => {
    if (change.id) {
      setEditingChangeId(change.id);
      setIsCompChangeModalOpen(true);
    }
  };

  const handleRemoveCompensationChange = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this compensation change? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/providers/${provider.employeeId}/compensation-changes`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        throw new Error('Failed to delete compensation change');
      }

      setCompensationHistory(prev => prev.filter(change => change.id !== id));
      toast({
        title: "Success",
        description: "Compensation change deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting compensation change:', error);
      toast({
        title: "Error",
        description: "Failed to delete compensation change",
        variant: "destructive"
      });
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

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    getRowStyle: (params: RowClassParams) => {
      if (params.node.rowIndex === params.api.getDisplayedRowCount() - 1) {
        return { borderBottom: '1px solid #e2e8f0' };
      }
      return undefined;
    }
  }), []);

  const metricsColumnDefs = useMemo<ColDef[]>(() => [
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
  ], [/* existing dependencies */]);

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
                  onClick={() => handleEditAdditionalPay(params.data as AdditionalPay & MonthlyValues)} 
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit additional pay"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleRemoveAdditionalPay(params.data.id)} 
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
        if (params.data.isHeader) {
          return <span className="font-semibold text-gray-900">{params.value}</span>;
        }
        return <span className={params.data.isSystem ? 'row-section-header' : ''}>{params.value}</span>;
      },
      cellClass: (params: any) => {
        const classes: string[] = [];
        if (params.data.isSystem) classes.push('row-section-header');
        if (params.data.isHeader) classes.push('font-semibold bg-gray-50');
        if (!params.data.isSystem && params.data.type === 'additionalPay') classes.push('adjustment-row');
        if (params.data.component === 'Total Comp.') classes.push('row-total');
        if (params.data.component.includes('Holdback')) classes.push('border-b-2 border-gray-900');
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
        if (params.data.isHeader) classes.push('font-semibold bg-gray-50');
        if (params.value < 0) classes.push('text-red-600');
        if (params.data.component === 'Total Comp.') classes.push('font-semibold');
        if (params.data.component.includes('Holdback')) classes.push('border-b-2 border-gray-900');
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
        if (params.data.isHeader) classes.push('font-semibold bg-gray-50');
        if (params.value < 0) classes.push('text-red-600');
        if (params.data.component === 'Total Comp.') classes.push('font-semibold');
        if (params.data.component.includes('Holdback')) classes.push('border-b-2 border-gray-900');
        return classes.join(' ');
      },
      valueFormatter: (params: any) => {
        if (params.data.isHeader) return '';
        return formatNegativeCurrency(params.value);
      },
      lockPinned: true,
      lockPosition: true,
      suppressMovable: true
    }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/wrvu-data');
      if (!response.ok) {
        throw new Error('Failed to fetch wRVU data');
      }
      const data = await response.json();
      const providerData = data.find((d: any) => d.employee_id === provider.employeeId);
      
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
        setBaseMonthlyData(monthlyData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

        // Fetch target adjustments with current year
        const currentYear = new Date().getFullYear();
        const targetResponse = await fetch(`/api/target-adjustments?providerId=${provider.id}&year=${currentYear}`);
        if (targetResponse.ok) {
          const targetData = await targetResponse.json();
          if (targetData.success) {
            setTargetAdjustments(targetData.data);
          }
        }

        // Fetch additional pay with current year
        const additionalPayResponse = await fetch(`/api/additional-pay?providerId=${provider.id}&year=${currentYear}`);
        if (additionalPayResponse.ok) {
          const additionalPayData = await additionalPayResponse.json();
          if (additionalPayData.success) {
            setAdditionalPayments(additionalPayData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching adjustments:', error);
      }
    };

    fetchAdjustments();
  }, [provider.id]);

  // Add initialization effect for additional payments
  useEffect(() => {
    const fetchAdditionalPayments = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const response = await getAdditionalPay(provider.id, currentYear);
        if (response.success && Array.isArray(response.data)) {
          setAdditionalPayments(response.data);
        }
      } catch (error) {
        console.error('Error fetching additional payments:', error);
        toast({
          title: "Error",
          description: "Failed to load additional payments",
          variant: "destructive"
        } as const);
      }
    };

    fetchAdditionalPayments();
  }, [provider.id]);

  useEffect(() => {
    const fetchCompensationChanges = async () => {
      try {
        const response = await fetch(`/api/providers/${provider.id}/compensation-changes`);
        if (response.ok) {
          const changes = await response.json();
          setCompensationHistory(changes);
        }
      } catch (error) {
        console.error('Error fetching compensation changes:', error);
      }
    };

    fetchCompensationChanges();
  }, [provider.id]);

  // Add the action buttons section above the table
  <div className="flex items-center justify-between mb-4">
    <div className="flex gap-2">
      {selectedProviders.length > 0 && (
        <>
          <button
            onClick={() => router.push(`/provider/${selectedProviders[0]}`)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Dashboard
          </button>
          <button
            onClick={() => handleEditProvider(selectedProviders[0])}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteProvider(selectedProviders[0])}
            className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => handleExportToExcel()}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Export to Excel
      </button>
      <button
        onClick={() => setIsAddProviderModalOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Add Provider
      </button>
    </div>
  </div>

  return (
    <>
      <div className="w-full">
        <style>{customStyles}</style>
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
                    .find(row => row.component === `Holdback (${holdbackPercentage}%)`)?.ytd || 0))}
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
              {!baseMonthlyData || Object.values(baseMonthlyData).every(v => v === 0) ? (
                <NoDataMessage message="No wRVU data is currently available. Please upload wRVU data to see metrics." />
              ) : (
                <>
                  <div id="metrics-table" className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Metrics & Adjustments</h2>
                        <button
                          onClick={() => setIsMetricsSectionCollapsed(!isMetricsSectionCollapsed)}
                          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <ChevronDownIcon 
                            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                              isMetricsSectionCollapsed ? '-rotate-90' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className={`transition-all duration-200 ease-in-out ${
                      isMetricsSectionCollapsed ? 'hidden' : 'block'
                    }`}>
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex gap-3">
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
                          <div className="bg-white rounded-md p-3 flex items-center gap-2 border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm">
                            <div className="bg-blue-50 rounded-md p-1.5">
                              <ChartBarIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-[11px] font-medium text-gray-500">wRVU Percentile</div>
                              <div className="text-base font-semibold text-gray-900 leading-tight">
                                {calculateWRVUPercentile(ytdWRVUs, months.length, provider.fte, marketData, provider.specialty, provider.clinicalFte).percentile.toFixed(1)}
                                <span className="text-xs font-normal text-gray-500 ml-0.5">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ag-theme-alpine w-full">
                          <AgGridReact
                            domLayout="autoHeight"
                            rowHeight={40}
                            headerHeight={40}
                            defaultColDef={defaultColDef}
                            columnDefs={metricsColumnDefs}
                            rowData={getRowData()}
                            onGridReady={onMetricsGridReady}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="compensation-table" className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Compensation Details</h2>
                        <button
                          onClick={() => setIsCompensationSectionCollapsed(!isCompensationSectionCollapsed)}
                          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <ChevronDownIcon 
                            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                              isCompensationSectionCollapsed ? '-rotate-90' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className={`transition-all duration-200 ease-in-out ${
                      isCompensationSectionCollapsed ? 'hidden' : 'block'
                    }`}>
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <button 
                            onClick={() => setIsAdditionalPayModalOpen(true)} 
                            className="inline-flex items-center px-6 py-2.5 bg-blue-600 rounded-full text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Additional Pay
                          </button>
                          {(() => {
                            const ytdTotal = getCompensationData().find(row => row.component === 'Total Comp.')?.ytd || 0;
                            const { percentile } = calculateTotalCompPercentile(ytdTotal, marketData);
                            return (
                              <div className="flex items-center gap-4">
                                <div className="bg-white rounded-md p-3 flex items-center gap-2 border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm">
                                  <div className="bg-blue-50 rounded-md p-1.5">
                                    <ChartBarIcon className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-[11px] font-medium text-gray-500">Total Comp. Percentile</div>
                                    <div className="text-base font-semibold text-gray-900 leading-tight">
                                      {percentile.toFixed(1)}
                                      <span className="text-xs font-normal text-gray-500 ml-0.5">%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="ag-theme-alpine w-full" style={{ overflow: 'hidden' }}>
                          <style>
                            {`
                              .ag-theme-alpine {
                                --ag-row-height: 40px !important;
                                --ag-header-height: 40px !important;
                              }
                              .ag-theme-alpine .ag-root-wrapper {
                                border: none;
                              }
                              .ag-theme-alpine .ag-root {
                                border: none;
                              }
                              .ag-theme-alpine .ag-center-cols-container {
                                min-height: unset !important;
                              }
                              .ag-theme-alpine .ag-center-cols-viewport {
                                min-height: unset !important;
                              }
                              .ag-theme-alpine .ag-body-viewport {
                                min-height: unset !important;
                              }
                              .ag-theme-alpine .ag-body-horizontal-scroll {
                                min-height: 0 !important;
                              }
                            `}
                          </style>
                          <AgGridReact
                            context={{ monthlyDetails }}
                            domLayout="autoHeight"
                            rowHeight={40}
                            headerHeight={40}
                            suppressRowHoverHighlight={true}
                            defaultColDef={defaultColDef}
                            columnDefs={compensationColumnDefs}
                            rowData={getCompensationData()}
                            onGridReady={onCompensationGridReady}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="space-y-6">
              {!marketData || marketData.length === 0 ? (
                <NoDataMessage message="No market data is currently available. Please upload market data to see analytics." />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
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
              )}

              {/* Add no-data state for wRVU chart */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden" id="wrvu-chart-section">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">wRVU Performance</h2>
                </div>
                <div className="p-6">
                  {!baseMonthlyData || Object.values(baseMonthlyData).every(v => v === 0) ? (
                    <NoDataMessage message="No wRVU data is currently available. Please upload wRVU data to see the performance chart." />
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <WRVUChart
                        actualWRVUs={getRowData().find(row=>row.metric==='Total wRVUs')?months.map(m=>getRowData().find(r=>r.metric==='Total wRVUs')?.[m.toLowerCase()]||0):[]}
                        targetWRVUs={getRowData().find(row=>row.metric==='Total Target')?months.map(m=>getRowData().find(r=>r.metric==='Total Target')?.[m.toLowerCase()]||0):[]}
                        months={months}
                      />
                    </div>
                  )}
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
                    onDelete={handleRemoveCompensationChange}
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

      <AdditionalPayModal
        isOpen={isAdditionalPayModalOpen}
        onClose={() => {
          setIsAdditionalPayModalOpen(false);
          setSelectedAdditionalPay(undefined);
        }}
        onSubmit={selectedAdditionalPay ? handleUpdateAdditionalPay : handleAddAdditionalPay}
        providerId={provider.id}
        initialData={selectedAdditionalPay}
      />
    </>
  );
}// Add helper function for PDF generation
const addSection = async (pdf: jsPDF, element: HTMLElement, x: number, y: number, scale: number) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width * scale;
    const imgHeight = canvas.height * scale;
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    return y + imgHeight;
  } catch (error) {
    console.error('Error adding section to PDF:', error);
    return y;
  }
};

// Fix the monthly detail type issues
const getMonthlyDetails = (effectiveDate: string, oldSalary: number, newSalary: number, oldFTE: number, newFTE: number): Record<string, MonthlyDetail> => {
  const effectiveMonth = new Date(effectiveDate).getMonth();
  const details: Record<string, MonthlyDetail> = {};

  months.forEach((month, index) => {
    const monthKey = month.toLowerCase();
    const oldMonthly = oldSalary / 12;
    const newMonthly = newSalary / 12;
    
    details[monthKey] = {
      month,
      value: index < effectiveMonth ? oldMonthly : newMonthly,
      changed: index >= effectiveMonth,
      prorated: false,
      oldAnnual: oldSalary,
      oldFTE,
      oldMonthly,
      ...(index >= effectiveMonth ? {
        newAnnual: newSalary,
        newFTE,
        newMonthly
      } : {})
    };
  });

  return details;
};

// Fix the grid row style
const getRowStyle = (params: any): GridRowStyle => {
  const data = params.data;
  if (!data) return {};

  const style: GridRowStyle = {};
  
  // ... rest of the function ...

  return style;
};

// Fix the productivity section
const getProductivitySection = (
  providerData: Provider,
  monthlyIncentiveCalculator: (month: string) => number
) => {
  if (providerData.compensationModel !== 'Base Pay') {
    return [
      {
        component: 'Productivity Incentives',
        isSystem: true,
        isHeader: true,
        ...months.reduce((acc, month) => ({ 
          ...acc, 
          [month.toLowerCase()]: 0 
        }), {}),
        ytd: 0
      },
      {
        component: 'Incentives',
        isSystem: true,
        ...months.reduce((acc, month) => ({ 
          ...acc, 
          [month.toLowerCase()]: monthlyIncentiveCalculator(month)
        }), {}),
        ytd: months.reduce((sum, month) => sum + monthlyIncentiveCalculator(month), 0)
      }
    ];
  }
  return [];
}


