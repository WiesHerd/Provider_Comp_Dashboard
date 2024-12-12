'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AddAdjustmentModal from './AddAdjustmentModal';
import WRVUChart from './WRVUChart';
import WRVUGauge from './WRVUGauge';
import { ChevronDownIcon, ChevronUpIcon, DocumentArrowDownIcon, CurrencyDollarIcon, ChartBarIcon, TrashIcon, PencilIcon, PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CompensationHistory from './CompensationHistory';
import CompensationChangeModal from './CompensationChangeModal';
import { CompensationChange } from '@/types/compensation';

interface ProviderDashboardProps {
  provider: {
    firstName: string;
    middleInitial?: string;
    lastName: string;
    suffix?: string;
    employeeId: string;
    specialty: string;
    annualSalary: number;
    annualWRVUTarget: number;
    conversionFactor: number;
    hireDate: Date;
    fte?: number;
  };
}

interface Provider {
  name: string;
  employeeId: string;
  providerType: 'Physician' | 'APP';
  specialty?: string;
  hireDate: Date;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const baseMonthlyData = Object.fromEntries(months.map((m) => [m.toLowerCase(), 400]));

const calculateMonthlyTarget = (annualSalary: number, conversionFactor: number, fte: number = 1.0) => {
  const annualTarget = (annualSalary / conversionFactor) * fte;
  const monthlyTarget = annualTarget / 12;
  return Object.fromEntries(months.map((m) => [m.toLowerCase(), monthlyTarget]));
};

const baseGridConfig = {
  domLayout: 'autoHeight',
  rowHeight: 48,
  headerHeight: 48,
  suppressColumnVirtualisation: true,
  suppressRowVirtualisation: true,
  defaultColDef: {
    resizable: true,
    sortable: false,
    suppressMenu: true,
    suppressSizeToFit: false,
    flex: 1,
    cellClass: 'ag-cell-vertically-aligned',
    headerClass: 'ag-header-cell-right',
  },
  suppressKeyboardEvent: (params: any) => {
    const { event } = params;
    return event.key === 'Enter' || event.key === 'Tab';
  },
  stopEditingWhenCellsLoseFocus: true,
  enterNavigatesVertically: false,
  enterNavigatesVerticallyAfterEdit: false,
  singleClickEdit: true,
  enableCellTextSelection: true,
  ensureDomOrder: true,
  suppressClickEdit: false
};

const customStyles = `
  .ag-theme-alpine {
    --ag-header-background-color: #cbd5e1;
    --ag-odd-row-background-color: #ffffff;
    --ag-even-row-background-color: #ffffff;
    --ag-border-color: #e2e8f0;
    --ag-header-font-weight: 600;
    --ag-header-font-size: 15.5px;
    --ag-row-hover-color: #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .ag-header-cell {
    font-size: 15.5px !important;
    font-weight: 600 !important;
    color: #1e293b !important;
  }

  .ag-row[row-index="0"] .ag-cell,
  .ag-row[row-index="3"] .ag-cell {
    background-color: #f1f5f9 !important;
    font-weight: 600;
  }

  .adjustment-row {
    background-color: #eef2ff !important;
  }
  .add-button {
    background-color: #2563eb;
    color: #fff;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 6px;
    transition: all 0.3s ease;
  }
  .add-button:hover {
    background-color: #1e40af;
  }
  .ag-right-aligned-header {
    text-align: right !important;
    padding-right: 20px !important;
  }
  .modal-overlay {
    z-index: 1000;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .modal-content {
    z-index: 1001;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

function calculateTotalWRVUs(baseData: any, adjustments: any[]) {
  const result = { ...baseData };
  
  months.forEach(month => {
    const monthKey = month.toLowerCase();
    let total = Number(baseData[monthKey]) || 0;
    
    adjustments.forEach(adj => {
      const adjValue = Number(adj[monthKey]) || 0;
      if (!isNaN(adjValue)) {
        total += adjValue;
      }
    });
    
    result[monthKey] = total;
  });
  
  result.ytd = months.reduce((sum, month) => sum + (result[month.toLowerCase()] || 0), 0);
  
  return result;
}

function calculateVariance(totalWRVUs: any, targetData: any) {
  const result: any = {};
  
  if (!totalWRVUs || !targetData) {
    return result;
  }

  months.forEach((month) => {
    const monthKey = month.toLowerCase();
    const actualValue = Number(totalWRVUs[monthKey]) || 0;
    const targetValue = Number(targetData[monthKey]) || 0;
    result[monthKey] = actualValue - targetValue;
  });

  result.ytd = months.reduce((sum, month) => {
    const monthKey = month.toLowerCase();
    return sum + (result[monthKey] || 0);
  }, 0);

  return result;
}

function calculateIncentive(variance: number, conversionFactor: number): number {
  return variance > 0 ? variance * conversionFactor : 0;
}

function calculateTotalTargets(baseTargetData: any, targetAdjustments: any[]) {
  const result = { ...baseTargetData };
  
  months.forEach(month => {
    const monthKey = month.toLowerCase();
    const adjustmentSum = targetAdjustments.reduce((sum, adj) => {
      const value = adj[monthKey];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    
    result[monthKey] = (result[monthKey] || 0) + adjustmentSum;
  });
  
  result.ytd = months.reduce((sum, month) => sum + (result[month.toLowerCase()] || 0), 0);
  
  return result;
}

function calculatePlanYearProgress(rowData: any[]) {
  const actualWRVUsRow = rowData.find(row => row.metric === 'Actual wRVUs');
  
  if (!actualWRVUsRow) return { completed: 0, total: 12, percentage: 0 };
  
  const monthsWithData = months.reduce((count, month) => {
    const value = actualWRVUsRow[month.toLowerCase()];
    return value > 0 ? count + 1 : count;
  }, 0);

  return {
    completed: monthsWithData,
    total: 12,
    percentage: (monthsWithData / 12) * 100
  };
}

function calculateYTDTargetProgress(rowData: any[]) {
  const ytdWRVUs = rowData.find(row => row.metric === 'Total wRVUs')?.ytd || 0;
  const ytdTarget = rowData.find(row => row.metric === 'Total Target')?.ytd || 0;

  return {
    actual: ytdWRVUs,
    target: ytdTarget,
    percentage: ytdTarget > 0 ? (ytdWRVUs / ytdTarget) * 100 : 0
  };
}

const SummaryCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconBackgroundColor?: string;
}> = ({ title, value, subtitle, icon, iconBackgroundColor }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 flex items-start">
    <div
      className={`w-10 h-10 mr-4 rounded-full flex items-center justify-center ${iconBackgroundColor || 'bg-blue-100'}`}
    >
      <span className="text-lg">{icon}</span>
    </div>
    <div>
      <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
  </div>
);

const PopupCellEditor = (props: any) => {
  const [value, setValue] = useState(props.value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      props.stopEditing();
    }
  };

  return (
    <div className="ag-custom-popup-editor" 
         style={{
           backgroundColor: 'white',
           padding: '5px',
           border: '1px solid #ccc',
           borderRadius: '4px',
           boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
         }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          height: '30px',
          padding: '0 8px',
          border: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ provider }) => {
  const [activeView, setActiveView] = useState('compensation');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'wrvu' | 'target' | 'additionalPay'>('wrvu');
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [targetAdjustments, setTargetAdjustments] = useState<any[]>([]);
  const [additionalPayments, setAdditionalPayments] = useState<any[]>([]);
  const [isMetricsTableVisible, setIsMetricsTableVisible] = useState(true);
  const [isCompTableVisible, setIsCompTableVisible] = useState(true);
  const [isGaugesVisible, setIsGaugesVisible] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isWRVUChartVisible, setIsWRVUChartVisible] = useState(true);
  const [compensationHistory, setCompensationHistory] = useState<CompensationChange[]>([]);
  const [isCompChangeModalOpen, setIsCompChangeModalOpen] = useState(false);
  const [currentSalary, setCurrentSalary] = useState(provider?.annualSalary || 0);
  const [currentFTE, setCurrentFTE] = useState(provider?.fte || 1.0);
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const [newSalary, setNewSalary] = useState<number>(0);
  const [newFTE, setNewFTE] = useState(1.0);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  const gridApi = useRef<any>(null);

  const targetMonthlyData = calculateMonthlyTarget(
    provider.annualSalary,
    provider.conversionFactor,
    provider.fte || 1.0
  );

  const onGridReady = (params: any) => {
    gridApi.current = params.api;
  };

  const handleCompensationChange = (data: CompensationChange) => {
    setCompensationHistory(prev => {
      if (editingChangeId) {
        return prev.map(change => 
          change.id === editingChangeId ? { ...data, id: editingChangeId } : change
        );
      }
      return [...prev, { ...data, id: `change-${Date.now()}` }];
    });

    setIsCompChangeModalOpen(false);
    setEditingChangeId(null);
    setCurrentSalary(0);
    setNewSalary(0);
    setCurrentFTE(0);
    setNewFTE(0);
    setEffectiveDate('');
    setChangeReason('');
  };

  const handleOpenAdjustmentModal = (type: 'wrvu' | 'target' | 'additionalPay') => {
    setAdjustmentType(type);
    setIsAdjustmentModalOpen(true);
  };

  const getRowData = () => {
    const calculateYTD = (baseData: any, adjustmentRows: any[]) => {
      let ytd = 0;
      months.forEach(month => {
        const monthKey = month.toLowerCase();
        ytd += Number(baseData[monthKey]) || 0;
        adjustmentRows.forEach(adj => {
          ytd += Number(adj[monthKey]) || 0;
        });
      });
      return ytd;
    };

    const wrvuYTD = calculateYTD(baseMonthlyData, adjustments);
    const targetYTD = calculateYTD(targetMonthlyData, targetAdjustments);
    const varianceYTD = wrvuYTD - targetYTD;

    return [
      { metric: 'wRVU Generation', isHeader: true },
      { metric: 'Actual wRVUs', ...baseMonthlyData, ytd: calculateYTD(baseMonthlyData, []) },
      ...adjustments.map(adj => ({
        ...adj,
        type: 'wrvu',
        isAdjustment: true,
        editable: true,
        ytd: calculateYTD(adj, [])
      })),
      { metric: 'Total wRVUs', ...calculateTotalWRVUs(baseMonthlyData, adjustments), ytd: wrvuYTD },
      { metric: 'wRVU Target', isHeader: true },
      { metric: 'Target wRVUs', ...targetMonthlyData, ytd: calculateYTD(targetMonthlyData, []) },
      ...targetAdjustments.map(adj => ({
        ...adj,
        type: 'target',
        isAdjustment: true,
        editable: true,
        ytd: calculateYTD(adj, [])
      })),
      { metric: 'Total Target', ...calculateTotalTargets(targetMonthlyData, targetAdjustments), ytd: targetYTD },
      { metric: 'Variance', ...calculateVariance(calculateTotalWRVUs(baseMonthlyData, adjustments), calculateTotalTargets(targetMonthlyData, targetAdjustments)), ytd: varianceYTD }
    ];
  };

  const totalWRVUs = calculateTotalWRVUs(baseMonthlyData, adjustments);
  const totalTargetsWithAdjustments = calculateTotalTargets(targetMonthlyData, targetAdjustments);
  const monthlyVariances = calculateVariance(totalWRVUs, totalTargetsWithAdjustments);
  const totalIncentives = months.reduce((sum, month) => {
    const v = monthlyVariances[month.toLowerCase()] || 0;
    return sum + calculateIncentive(v, provider.conversionFactor);
  }, 0);
  const ytdWRVUs = totalWRVUs.ytd;

  const getCompensationData = () => {
    const baseSalaryMonthly = provider.annualSalary / 12;

    // Calculate total WRVUs and targets first
    const totalWRVUsWithAdjustments = calculateTotalWRVUs(baseMonthlyData, adjustments);
    const totalTargetsAdjusted = calculateTotalTargets(targetMonthlyData, targetAdjustments);
    const monthlyVariances = calculateVariance(totalWRVUsWithAdjustments, totalTargetsAdjusted);

    // Calculate monthly incentives
    const monthlyIncentives: any = {};
    let totalIncentive = 0;

    months.forEach(month => {
      const monthKey = month.toLowerCase();
      const incentive = calculateIncentive(monthlyVariances[monthKey], provider.conversionFactor);
      monthlyIncentives[monthKey] = incentive;
      totalIncentive += incentive;
    });

    const holdback = totalIncentive * 0.2;
    const netIncentive = totalIncentive - holdback;

    // Calculate running YTD incentives
    const ytdIncentives = months.reduce((acc, month, index) => {
      const monthKey = month.toLowerCase();
      const runningTotal = months
        .slice(0, index + 1)
        .reduce((sum, m) => sum + ((monthlyIncentives[m.toLowerCase()] || 0) * 0.8), 0);
      return { ...acc, [monthKey]: runningTotal };
    }, {});

    // Calculate total compensation
    const totalCompensation = months.reduce((acc, month) => {
      const monthKey = month.toLowerCase();
      const monthlyTotal = baseSalaryMonthly + 
        (monthlyIncentives[monthKey] || 0) * 0.8 +
        (additionalPayments.reduce((sum, payment) => sum + (payment[monthKey] || 0), 0));
      return { ...acc, [monthKey]: monthlyTotal };
    }, {});

    return [
      {
        component: 'Base Salary',
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: baseSalaryMonthly
        }), {}),
        ytd: provider.annualSalary
      },
      ...additionalPayments,
      {
        component: 'Incentive (100%)',
        ...monthlyIncentives,
        ytd: totalIncentive
      },
      {
        component: 'Holdback (20%)',
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: -(monthlyIncentives[month.toLowerCase()] || 0) * 0.2
        }), {}),
        ytd: -holdback
      },
      {
        component: 'Net Incentive (80%)',
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: (monthlyIncentives[month.toLowerCase()] || 0) * 0.8
        }), {}),
        ytd: netIncentive
      },
      {
        component: 'YTD Incentive',
        ...ytdIncentives,
        ytd: netIncentive
      },
      {
        component: 'Total Comp.',
        ...totalCompensation,
        ytd: provider.annualSalary + netIncentive + 
             additionalPayments.reduce((sum, payment) => 
               sum + months.reduce((mSum, m) => mSum + (payment[m.toLowerCase()] || 0), 0), 0)
      }
    ];
  };

  const handleAddAdjustment = (data: any) => {
    if (data.type === 'target') {
      const newTargetAdjustment = {
        id: editingPayment?.id || Math.random().toString(36).substr(2, 9),
        metric: data.name,
        description: data.description,
        isAdjustment: true,
        editable: true,
        type: 'target',
        ...Object.keys(data.monthlyAmounts).reduce((acc, month) => ({
          ...acc,
          [month]: parseFloat(data.monthlyAmounts[month]) || 0
        }), {}),
        ytd: Object.values(data.monthlyAmounts)
          .reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
      };

      if (editingPayment) {
        setTargetAdjustments(prev => 
          prev.map(adj => adj.id === editingPayment.id ? newTargetAdjustment : adj)
        );
      } else {
        setTargetAdjustments(prev => [...prev, newTargetAdjustment]);
      }
    } else if (data.type === 'wrvu') {
      const newAdjustment = {
        id: editingPayment?.id || Math.random().toString(36).substr(2, 9),
        metric: data.name,
        description: data.description,
        isAdjustment: true,
        editable: true,
        ...data.monthlyAmounts,
        ytd: Object.values(data.monthlyAmounts).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
      };
      
      if (editingPayment) {
        setAdjustments(prev => prev.map(adj => 
          adj.id === editingPayment.id ? newAdjustment : adj
        ));
      } else {
        setAdjustments(prev => [...prev, newAdjustment]);
      }
    } else if (data.type === 'additionalPay') {
      const monthlyValues = Object.values(data.monthlyAmounts).map(val => parseFloat(val as string) || 0);
      const ytdValue = monthlyValues.reduce((sum, val) => sum + val, 0);

      const newPayment = {
        component: data.name,
        description: data.description,
        ...Object.fromEntries(
          Object.entries(data.monthlyAmounts).map(([m, v]) => [m.toLowerCase(), parseFloat(v as string) || 0])
        ),
        ytd: ytdValue
      };

      if (isEditing) {
        setAdditionalPayments(prev => 
          prev.map(payment => 
            payment.component === editingPayment?.component
              ? { ...payment, ...newPayment }
              : payment
          )
        );
      } else {
        setAdditionalPayments(prev => [...prev, newPayment]);
      }
    }
    
    setIsAdjustmentModalOpen(false);
    setIsEditing(false);
    setEditingPayment(null);
  };

  const handleRemoveAdjustment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      setAdjustments(prev => prev.filter(adj => adj.id !== id));
    }
  };

  const handleRemoveTargetAdjustment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      setTargetAdjustments(prev => prev.filter(adj => adj.id !== id));
    }
  };

  const metricsColumnDefs = [
    {
      field: 'metric',
      headerName: '',
      minWidth: 200,
      cellRenderer: (params: any) => {
        if (params.data.isAdjustment) {
          return (
            <div className="flex items-center justify-between">
              <span>{params.value}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditAdjustment(params.data)}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                  title="Edit adjustment"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this adjustment?')) {
                      if (params.data.type === 'target') {
                        handleRemoveTargetAdjustment(params.data.id);
                      } else {
                        handleRemoveAdjustment(params.data.id);
                      }
                    }
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Delete adjustment"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        }
        return params.value;
      },
      cellStyle: (params: any) => ({
        backgroundColor: params.data.isHeader ? '#f1f5f9' : 'transparent',
        fontWeight: params.data.isHeader ? '600' : '400',
        paddingLeft: '24px'
      })
    },
    ...months.map(month => ({
      field: month.toLowerCase(),
      headerName: month,
      minWidth: 130,
      headerClass: 'ag-right-aligned-header',
      cellStyle: (params: any) => {
        const baseStyle = {
          textAlign: 'right',
          paddingRight: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%'
        };

        if (params.data.metric === 'Variance') {
          const value = Number(params.value);
          return {
            ...baseStyle,
            backgroundColor: value > 0 ? '#dcfce7' : value < 0 ? '#fee2e2' : 'transparent',
            color: value > 0 ? '#15803d' : value < 0 ? '#dc2626' : 'inherit',
            fontWeight: '600'
          };
        }

        if (params.data.metric === 'Actual wRVUs' || 
            params.data.metric === 'Target wRVUs') {
          return {
            ...baseStyle,
            fontWeight: '600'
          };
        }

        return baseStyle;
      },
      editable: (params: any) => params.data.type === 'wrvu' || params.data.type === 'target',
      valueFormatter: (params: any) => {
        if (params.data.isHeader) return '';
        return formatNumber(params.value);
      },
      valueSetter: (params: any) => {
        if (params.data.type === 'wrvu' || params.data.type === 'target') {
          const newValue = Number(params.newValue);
          if (!isNaN(newValue)) {
            params.data[params.column.colId] = newValue;
            if (params.data.type === 'wrvu') {
              setAdjustments(prev => 
                prev.map(adj => adj.id === params.data.id ? { ...adj, [params.column.colId]: newValue } : adj)
              );
            } else if (params.data.type === 'target') {
              setTargetAdjustments(prev => 
                prev.map(adj => adj.id === params.data.id ? { ...adj, [params.column.colId]: newValue } : adj)
              );
            }
            return true;
          }
        }
        return false;
      }
    })),
    {
      field: 'ytd',
      headerName: 'YTD',
      minWidth: 130,
      headerClass: 'ag-right-aligned-header',
      cellStyle: (params: any) => {
        const baseStyle = { 
          textAlign: 'right',
          paddingRight: '24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          height: '100%'
        };

        if (params.data.isHeader) {
          return {
            ...baseStyle,
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0'
          };
        }

        if (params.data.metric === 'Variance') {
          const value = Number(params.value);
          return {
            ...baseStyle,
            backgroundColor: value > 0 ? '#dcfce7' : value < 0 ? '#fee2e2' : 'transparent',
            color: value > 0 ? '#15803d' : value < 0 ? '#dc2626' : 'inherit',
            borderTop: '2px solid #e2e8f0',
            fontSize: '16px',
            fontWeight: 600
          };
        }

        return baseStyle;
      },
      valueFormatter: (params: any) => {
        if (params.value === undefined || params.value === null) return '';
        return formatNumber(params.value);
      }
    }
  ];

  const handleRemoveAdditionalPay = (payName: string) => {
    setAdditionalPayments(prev => prev.filter(p => p.component !== payName));
  };

  const compensationColumnDefs = [
    { 
      field: 'component',
      headerName: '',
      minWidth: 150,
      cellRenderer: (params: any) => {
        const isAdditionalPay = params.data.component !== 'Base Salary' && 
                               params.data.component !== 'Incentive (100%)' &&
                               params.data.component !== 'Holdback (20%)' &&
                               params.data.component !== 'Net Incentive (80%)' &&
                               params.data.component !== 'YTD Incentive' &&
                               params.data.component !== 'Total Comp.';

        if (isAdditionalPay) {
          return (
            <div className="flex items-center justify-between">
              <span>{params.value}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditAdditionalPay(params.data)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleRemoveAdditionalPay(params.data.component)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        }
        return params.value;
      },
      cellStyle: { textAlign: 'left' }
    },
    ...months.map(month => ({
      field: month.toLowerCase(),
      headerName: month,
      headerClass: 'ag-right-aligned-header',
      valueFormatter: (params: any) => {
        if (params.value === undefined || params.value === null) return '$0.00';
        return formatCurrency(params.value);
      },
      editable: (params: any) => {
        return params.data.component !== 'Base Salary' && 
               params.data.component !== 'Incentive (100%)' &&
               params.data.component !== 'Holdback (20%)' &&
               params.data.component !== 'Net Incentive (80%)' &&
               params.data.component !== 'YTD Incentive' &&
               params.data.component !== 'Total Comp.';
      },
      cellStyle: (params: any) => ({
        textAlign: 'right',
        fontWeight: params.data.component === 'Total Comp.' ? '600' : 'normal'
      })
    })),
    {
      field: 'ytd',
      headerName: 'YTD',
      valueGetter: (params: any) => {
        return months.reduce((sum, month) => {
          return sum + (params.data[month.toLowerCase()] || 0);
        }, 0);
      },
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: (params: any) => ({
        textAlign: 'right',
        fontWeight: params.data.component === 'Total Comp.' ? '600' : 'normal'
      })
    }
  ];

  const handleExportPDF = async () => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });
    
    setIsGaugesVisible(true);
    setIsWRVUChartVisible(true);
    setIsMetricsTableVisible(true);
    setIsCompTableVisible(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const headerSection = document.querySelector('.dashboard-header');
      const summaryCards = document.querySelector('.summary-cards');
      const performanceMetrics = document.querySelector('.performance-metrics');

      const addSection = async (pdf: jsPDF, element: HTMLElement | null, x: number, y: number, scale: number) => {
        if (!element) return;
        
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
      };

      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      await addSection(pdf, headerSection as HTMLElement, 40, 40, 0.8);
      await addSection(pdf, summaryCards as HTMLElement, 40, 120, 0.8);
      await addSection(pdf, performanceMetrics as HTMLElement, 40, 280, 0.8);

      pdf.addPage();
      const wrvuChart = document.getElementById('wrvu-chart-section');
      await addSection(pdf, wrvuChart as HTMLElement, 40, 40, 0.8);

      pdf.addPage();
      const metricsTable = document.getElementById('metrics-table');
      await addSection(pdf, metricsTable as HTMLElement, 40, 40, 0.75);
      
      const compensationTable = document.getElementById('compensation-table');
      await addSection(pdf, compensationTable as HTMLElement, 40, 400, 0.75);

      pdf.save(`${provider.firstName}_${provider.lastName}_Dashboard.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGaugesVisible(false);
      setIsWRVUChartVisible(false);
      setIsMetricsTableVisible(false);
      setIsCompTableVisible(false);
    }
  };

  const handleEditAdditionalPay = (paymentData: any) => {
    const fullPaymentData = additionalPayments.find(p => p.component === paymentData.component);
    
    const editData = {
      id: paymentData.id || Math.random().toString(36).substr(2, 9),
      component: paymentData.component,
      name: paymentData.component,
      description: fullPaymentData?.description || '',
      type: 'additionalPay',
      jan: paymentData.jan || 0,
      feb: paymentData.feb || 0,
      mar: paymentData.mar || 0,
      apr: paymentData.apr || 0,
      may: paymentData.may || 0,
      jun: paymentData.jun || 0,
      jul: paymentData.jul || 0,
      aug: paymentData.aug || 0,
      sep: paymentData.sep || 0,
      oct: paymentData.oct || 0,
      nov: paymentData.nov || 0,
      dec: paymentData.dec || 0
    };
    
    setEditingPayment(editData);
    setAdjustmentType('additionalPay');
    setIsEditing(true);
    setIsAdjustmentModalOpen(true);
  };

  const handleEditAdjustment = (adjustmentData: any) => {
    const editData = {
      id: adjustmentData.id,
      name: adjustmentData.metric,
      description: adjustmentData.description,
      type: adjustmentData.type,
      monthlyAmounts: months.reduce((acc, month) => ({
        ...acc,
        [month]: adjustmentData[month.toLowerCase()] || 0
      }), {})
    };
    
    setEditingPayment(editData);
    setAdjustmentType(adjustmentData.type);
    setIsAdjustmentModalOpen(true);
  };

  const handleOpenCompChangeModal = () => {
    setIsCompChangeModalOpen(true);
    setCurrentFTE(provider?.fte || 1.0);
  };

  const gridStyles = `
    .ag-cell-vertically-aligned {
      line-height: 48px !important;  
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }
    .ag-header-cell-right .ag-header-cell-label {
      justify-content: flex-end;
      padding-right: 16px;
    }
  `;

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = gridStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <>
      <div className="max-w-full px-8">
        <style>{customStyles}</style>
        <div className="dashboard-header bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="px-6 pt-6">
            <div className="flex justify-between items-start">
              <div className="text-center flex-1">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  {provider.firstName} {provider.lastName}, {provider.suffix || 'MD'} <span className="text-gray-600">- Specialty: {provider.specialty}</span>
                </h1>
                <div className="text-gray-600 mb-3">
                  Provider Compensation Dashboard
                </div>
                <div className="text-gray-600 text-sm">
                  Employee ID: {provider.employeeId} <span className="mx-3">•</span> FTE: {provider.fte || 1.0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex justify-center -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveView('compensation')}
              className={`
                inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
                ${activeView === 'compensation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                transition-colors duration-200
              `}
            >
              <CurrencyDollarIcon className="h-5 w-5" />
              wRVUs & Comp
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`
                inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
                ${activeView === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <ChartBarIcon className="h-5 w-5" />
              Charts & Stats
            </button>
            <button
              onClick={() => setActiveView('control')}
              className={`
                ${activeView === 'control'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center px-3 py-2 text-sm font-medium border-b-2
              `}
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Control Panel
            </button>
          </nav>
        </div>

        <div className="summary-cards grid grid-cols-5 gap-6 mb-8">
          <SummaryCard
            title="Base Salary"
            value={formatCurrency(provider.annualSalary)}
            subtitle="Annual Compensation"
            icon="💵"
            iconBackgroundColor="bg-green-100"
          />
          <SummaryCard
            title="YTD wRVUs"
            value={formatNumber(ytdWRVUs)}
            subtitle={`Target: ${formatNumber(provider.annualWRVUTarget)}`}
            icon="📊"
            iconBackgroundColor="bg-blue-100"
          />
          <SummaryCard
            title="Conversion Factor"
            value={formatCurrency(provider.conversionFactor)}
            subtitle="Per wRVU"
            icon="⚙️"
            iconBackgroundColor="bg-purple-100"
          />
          <SummaryCard
            title="Incentives Earned"
            value={formatCurrency(totalIncentives)}
            subtitle="Year to Date"
            icon=""
            iconBackgroundColor="bg-yellow-100"
          />
          <SummaryCard
            title="Holdback"
            value={formatCurrency(Math.abs(getCompensationData()
              .find(row => row.component === 'Holdback (20%)')?.ytd || 0))}
            subtitle="Year to Date"
            icon="🔄"
            iconBackgroundColor="bg-red-100"
          />
        </div>

        <div className="transition-all duration-300 ease-in-out">
          {activeView === 'compensation' ? (
            <div className="space-y-8">
              <div id="metrics-table" className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium">Metrics & Adjustments</h2>
                </div>
                <div className="p-6">
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => handleOpenAdjustmentModal('wrvu')} 
                      className="add-button"
                    >
                      Add wRVU Adjustment
                    </button>
                    <button 
                      onClick={() => handleOpenAdjustmentModal('target')} 
                      className="add-button"
                    >
                      Add Target Adjustment
                    </button>
                  </div>
                  <div className="ag-theme-alpine w-full">
                    <AgGridReact
                      {...baseGridConfig}
                      columnDefs={metricsColumnDefs}
                      rowData={getRowData()}
                    />
                  </div>
                </div>
              </div>

              <div id="compensation-table" className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium">Compensation Details</h2>
                </div>
                <div className="p-6">
                  <button 
                    onClick={() => handleOpenAdjustmentModal('additionalPay')} 
                    className="add-button mb-6"
                  >
                    Add Additional Pay
                  </button>
                  <div className="ag-theme-alpine w-full">
                    <AgGridReact
                      {...baseGridConfig}
                      columnDefs={compensationColumnDefs.map(col => ({
                        ...col,
                        minWidth: col.field === 'component' ? 150 : 130,
                        width: col.field === 'ytd' ? 140 : 130,
                        suppressSizeToFit: col.field !== 'component',
                      }))}
                      rowData={getCompensationData()}
                      onGridReady={(params) => {
                        if (params.api) {
                          params.api.sizeColumnsToFit();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : activeView === 'analytics' ? (
            <div className="space-y-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden performance-metrics">
                <h2 className="text-xl font-medium text-center py-4 border-b border-gray-200">
                  Performance Metrics
                </h2>
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="flex flex-col items-center">
                      <WRVUGauge 
                        title="Plan Year Progress" 
                        value={calculatePlanYearProgress(getRowData()).percentage}
                        subtitle={`${calculatePlanYearProgress(getRowData()).completed} of ${calculatePlanYearProgress(getRowData()).total} months`}
                        size="large"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <WRVUGauge 
                        title="Target Progress" 
                        value={calculateYTDTargetProgress(getRowData()).percentage}
                        subtitle={`${formatNumber(calculateYTDTargetProgress(getRowData()).actual)} of ${formatNumber(calculateYTDTargetProgress(getRowData()).target)}`}
                        size="large"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <WRVUGauge 
                        title="Incentive % of Base" 
                        value={(totalIncentives / provider.annualSalary) * 100}
                        subtitle={`${formatCurrency(totalIncentives)} of ${formatCurrency(provider.annualSalary)}`}
                        size="large"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" id="wrvu-chart-section">
                <h2 className="text-xl font-medium text-center py-4 border-b border-gray-200">
                  wRVU Performance
                </h2>
                <div className="p-6">
                  <WRVUChart 
                    actualWRVUs={getRowData().find(row => row.metric === 'Total wRVUs') ? months.map(m => getRowData().find(row => row.metric === 'Total wRVUs')?.[m.toLowerCase()] || 0) : []}
                    targetWRVUs={getRowData().find(row => row.metric === 'Total Target') ? months.map(m => getRowData().find(row => row.metric === 'Total Target')?.[m.toLowerCase()] || 0) : []}
                    months={months}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium">Compensation Management</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Record Compensation Change</h3>
                      <p className="text-gray-600 mb-4">
                        Update provider's base salary, FTE, or other compensation details.
                      </p>
                      <button
                        onClick={() => handleOpenCompChangeModal()}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                        Record Change
                      </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Additional Pay Management</h3>
                      <p className="text-gray-600 mb-4">
                        Add or manage additional payments and adjustments.
                      </p>
                      <button
                        onClick={() => handleOpenAdjustmentModal('additionalPay')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Additional Pay
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">wRVU Adjustments</h3>
                      <p className="text-gray-600 mb-4">
                        Add or manage wRVU adjustments.
                      </p>
                      <button
                        onClick={() => handleOpenAdjustmentModal('wrvu')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add wRVU Adjustment
                      </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Target Adjustments</h3>
                      <p className="text-gray-600 mb-4">
                        Add or manage target adjustments.
                      </p>
                      <button
                        onClick={() => handleOpenAdjustmentModal('target')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Target Adjustment
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <CompensationHistory 
                      changes={compensationHistory} 
                      onDelete={(id) => setCompensationHistory(prev => prev.filter(change => change.id !== id))}
                      onEdit={(change) => {
                        setIsCompChangeModalOpen(true);
                        setEditingChangeId(change.id);
                        setCurrentSalary(change.previousSalary);
                        setNewSalary(change.newSalary);
                        setCurrentFTE(change.previousFTE);
                        setNewFTE(change.newFTE);
                        setEffectiveDate(change.effectiveDate);
                        setChangeReason(change.reason || '');
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
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setIsEditing(false);
          setEditingPayment(null);
        }}
        onAdd={handleAddAdjustment}
        type={adjustmentType}
        editingData={editingPayment}
      />

      <CompensationChangeModal
        isOpen={isCompChangeModalOpen}
        onClose={() => {
          setIsCompChangeModalOpen(false);
          setEditingChangeId(null);
        }}
        onSave={handleCompensationChange}
        currentSalary={currentSalary}
        newSalary={newSalary}
        currentFTE={currentFTE}
        newFTE={newFTE}
        currentCF={provider.conversionFactor || 45.00}
        effectiveDate={effectiveDate}
        reason={changeReason}
        editingChange={editingChangeId ? compensationHistory.find(c => c.id === editingChangeId) : undefined}
      />
    </>
  );
};

export default ProviderDashboard;
