'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AddAdjustmentModal from './AddAdjustmentModal';
import WRVUChart from './WRVUChart';
import WRVUGauge from './WRVUGauge';
import { CurrencyDollarIcon, ChartBarIcon, PencilIcon, TrashIcon, PlusIcon, Cog6ToothIcon, BanknotesIcon, ChartPieIcon, ScaleIcon, ArrowTrendingUpIcon, ArrowPathIcon, ArrowDownTrayIcon, InformationCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CompensationHistory from './CompensationHistory';
import CompensationChangeModalComponent from './CompensationChangeModal';
import { CompensationChange } from '@/types/compensation';
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

interface Provider {
  id: string;
  employeeId: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  suffix?: string;
  email: string;
  specialty: string;
  department: string;
  status: string;
  terminationDate?: string;
  hireDate: string;
  fte: number;
  baseSalary: number;
  compensationModel: string;
  annualWRVUTarget: number;
  createdAt: string;
  updatedAt: string;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const baseMonthlyData = Object.fromEntries(months.map((m) => [m.toLowerCase(), 400]));

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
  const [metricsGridApi, setMetricsGridApi] = useState<GridApi | null>(null);
  const [compensationGridApi, setCompensationGridApi] = useState<GridApi | null>(null);

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

  const [holdbackPercentage, setHoldbackPercentage] = useState(20);

  const [marketData, setMarketData] = useState<any[]>([]);

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

  const totalWRVUs = useMemo(() => calculateTotalWRVUs(baseMonthlyData, adjustments), [adjustments]);
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
        ...adj, type: 'wrvu', isAdjustment: true, editable: true, ytd: calculateYTD(adj, []), section: 'generation'
      })),
      { metric: 'Total wRVUs', ...totalWRVUs, ytd: totalWRVUs.ytd, section: 'generation' },
      { metric: 'wRVU Target', isHeader: true, section: 'target' },
      { metric: 'Target wRVUs', ...targetMonthlyData, ytd: calculateYTD(targetMonthlyData, []), section: 'target' },
      ...targetAdjustments.map(adj => ({
        ...adj, type: 'target', isAdjustment: true, editable: true, ytd: calculateYTD(adj, []), section: 'target'
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
        ytd: months.reduce((sum, month) => sum + (getMonthlyIncentive(month) || 0), 0),
      },
      {
        component: `Holdback (${holdbackPercentage}%)`,
        isSystem: true,
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: -1 * (monthlySalaries[month.toLowerCase()] || 0) * (holdbackPercentage / 100),
        }), {}),
        ytd: -1 * Object.values(monthlySalaries).reduce((sum, val) => sum + (Number(val) || 0), 0) * (holdbackPercentage / 100),
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
        // Sum all incentives up to and including current month
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
      // If Call Pay doesn't exist, add it after the system rows
      const lastSystemRowIndex = baseData.filter(row => row.isSystem).length - 1;
      baseData.splice(lastSystemRowIndex + 1, 0, ytdIncentivesRow);
    }

    const totals = months.reduce((acc, month) => {
      const monthTotal = baseData.reduce((sum, row) => sum + (Number(row[month.toLowerCase()]) || 0), 0);
      return { ...acc, [month.toLowerCase()]: monthTotal };
    }, {});

    const ytdTotal = baseData.reduce((sum, row) => sum + (Number(row.ytd) || 0), 0);

    return [
      ...baseData,
      {
        component: 'Total Comp.',
        isSystem: true,
        ...totals,
        ytd: ytdTotal,
      },
    ];
  };

  const handleOpenAdjustmentModal = (type:'wrvu'|'target'|'additionalPay') => {
    setAdjustmentType(type);
    setIsAdjustmentModalOpen(true);
  };

  const handleAddAdjustment = (data: any) => {
    const id = editingPayment?.id || Math.random().toString(36).substr(2, 9);
    
    // Extract monthly values directly from data
    const monthlyValues = months.reduce((acc, month) => ({
      ...acc,
      [month.toLowerCase()]: Number(data[month.toLowerCase()] || 0)
    }), {});

    if (adjustmentType === 'additionalPay') {
      const paymentData = {
        id,
        name: data.name,
        component: data.name,
        description: data.description,
        type: 'additionalPay',
        isSystem: false,
        ...monthlyValues,
        ytd: Object.values(monthlyValues).reduce((sum, val) => sum + (Number(val) || 0), 0)
      };
      
      if (editingPayment) {
        setAdditionalPayments(prev => prev.map(p => p.id === id ? paymentData : p));
      } else {
        setAdditionalPayments(prev => [...prev, paymentData]);
      }
    } else if (adjustmentType === 'wrvu') {
      const adjustmentData = {
        id,
        metric: data.name,
        description: data.description,
        type: 'wrvu',
        isAdjustment: true,
        ...monthlyValues
      };
      
      if (editingPayment) {
        setAdjustments(prev => prev.map(adj => adj.id === id ? adjustmentData : adj));
      } else {
        setAdjustments(prev => [...prev, adjustmentData]);
      }
    } else if (adjustmentType === 'target') {
      const targetData = {
        id,
        metric: data.name,
        description: data.description,
        type: 'target',
        isAdjustment: true,
        ...monthlyValues
      };
      
      if (editingPayment) {
        setTargetAdjustments(prev => prev.map(adj => adj.id === id ? targetData : adj));
      } else {
        setTargetAdjustments(prev => [...prev, targetData]);
      }
    }
    
    setIsAdjustmentModalOpen(false);
    setEditingPayment(null);
    setIsEditing(false);
  };

  const handleEditAdjustment = (adjustment: any) => {
    console.log('Raw adjustment data:', adjustment);
    
    // Pass the adjustment data directly without transformation
    setEditingPayment(adjustment);
    setAdjustmentType(adjustment.type);
    setIsEditing(true);
    setIsAdjustmentModalOpen(true);
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

  const handleCompensationChange = (data: Omit<CompensationChange, 'id' | 'providerId' | 'previousSalary' | 'previousFTE'>) => {
    const change: CompensationChange = {
      id: crypto.randomUUID(),
      providerId: provider.id,
      previousSalary: provider.baseSalary,
      previousFTE: provider.fte,
      effectiveDate: data.effectiveDate,
      newSalary: data.newSalary,
      newFTE: data.newFTE,
      conversionFactor: getConversionFactor(),
      reason: data.reason
    };
    setCompensationHistory([...compensationHistory, change]);
    setIsCompChangeModalOpen(false);
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
      --ag-font-size: 13px;
      --ag-font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      border: 1px solid var(--ag-border-color);
      border-radius: 8px;
    }

    /* Remove gap between pinned right column */
    .ag-pinned-right-cols-container {
      margin-left: -1px !important;
    }

    .ag-pinned-right-header {
      margin-left: -1px !important;
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
      padding: 0 3px !important;
    }

    .ag-cell {
      padding: 0 3px !important;
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

    /* Ensure the grid container doesn't overflow */
    .ag-theme-alpine .ag-root-wrapper {
      max-width: 100%;
      overflow-x: hidden !important;
    }

    /* Remove horizontal scrollbar */
    .ag-body-horizontal-scroll {
      display: none !important;
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
      width: 180,
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
      minWidth: 90,
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
      width: 130,
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
      suppressMovable: true
    }
  ];

  const compensationColumnDefs = [
    {
      field: 'component',
      headerName: '',
      pinned: 'left' as const,
      width: 150,
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
      minWidth: 90,
      suppressSizeToFit: false,
      headerClass: 'text-right',
      cellClass: (params: any) => {
        const classes = ['text-right', 'number-cell'];
        if (params.value < 0) classes.push('text-red-600');
        return classes.join(' ');
      },
      cellStyle: { textAlign: 'right' },
      cellRenderer: (params: any) => {
        const value = params.value;
        const formattedValue = formatNegativeCurrency(value);
        return <span title={formattedValue} className="truncate block">{formattedValue}</span>;
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
        const classes = ['text-right', 'number-cell'];
        if (params.value < 0) classes.push('text-red-600');
        return classes.join(' ');
      },
      cellStyle: { textAlign: 'right' },
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

  useEffect(() => {
    // Initialize state with provider data
    setAnnualSalary(provider.baseSalary);
    setFte(provider.fte);
  }, [provider]);

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
              <div id="metrics-table" className="bg-white rounded-lg shadow-sm border border-gray-200" style={{width: '100%'}}>
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

              <div id="compensation-table" className="bg-white rounded-lg shadow-sm border border-gray-200" style={{width: '100%'}}>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Compensation Details</h2>
                </div>
                <div className="p-6">
                  <button 
                    onClick={() => handleOpenAdjustmentModal('additionalPay')} 
                    className="inline-flex items-center px-6 py-2.5 mb-6 bg-blue-600 rounded-full text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Additional Pay
                  </button>
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
                          <div className="mt-3 flex gap-3">
                            <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                              View Details
                            </button>
                            <button className="inline-flex items-center px-3 py-1.5 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors">
                              Set Reminders
                            </button>
                          </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Holdback Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Holdback Percentage
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={holdbackPercentage}
                              onChange={(e) => setHoldbackPercentage(Number(e.target.value))}
                              className="w-full"
                            />
                            <span className="text-sm font-medium text-gray-900 min-w-[4rem]">
                              {holdbackPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Record Compensation Change</h3>
                      <p className="text-gray-600 mb-4">Update provider's base salary, FTE, or other compensation details.</p>
                      <button
                        onClick={handleOpenCompChangeModal}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <CurrencyDollarIcon className="h-5 w-5 mr-2"/>
                        Record Change
                      </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Additional Pay Management</h3>
                      <p className="text-gray-600 mb-4">Add or manage additional payments and adjustments.</p>
                      <button
                        onClick={()=>handleOpenAdjustmentModal('additionalPay')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2"/>
                        Add Additional Pay
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">wRVU Adjustments</h3>
                      <p className="text-gray-600 mb-4">Add or manage wRVU adjustments.</p>
                      <button
                        onClick={()=>handleOpenAdjustmentModal('wrvu')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2"/>
                        Add wRVU Adjustment
                      </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Target Adjustments</h3>
                      <p className="text-gray-600 mb-4">Add or manage target adjustments.</p>
                      <button
                        onClick={()=>handleOpenAdjustmentModal('target')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2"/>
                        Add Target Adjustment
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <CompensationHistory
                      changes={compensationHistory}
                      onDelete={(id)=>setCompensationHistory(prev=>prev.filter(change=>change.id!==id))}
                      onEdit={(change)=>{
                        setIsCompChangeModalOpen(true);
                        setEditingChangeId(change.id);
                        setNewSalary(change.newSalary);
                        setNewFTE(change.newFTE);
                        setEffectiveDate(change.effectiveDate);
                        setChangeReason(change.reason||'');
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={()=>{
          setIsAdjustmentModalOpen(false);
          setIsEditing(false);
          setEditingPayment(null);
        }}
        onAdd={handleAddAdjustment}
        type={adjustmentType}
        editingData={editingPayment}
      />

      <CompensationChangeModalComponent
        isOpen={isCompChangeModalOpen}
        onClose={handleCloseCompChangeModal}
        currentSalary={provider.baseSalary}
        currentFTE={provider.fte}
        conversionFactor={getConversionFactor()}
        onSave={handleCompensationChange}
      />
    </>
  );
}
