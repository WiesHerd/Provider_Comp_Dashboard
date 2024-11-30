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

// Step 1: Types/Interfaces
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
  };
}

interface Provider {
  name: string;
  employeeId: string;
  providerType: 'Physician' | 'APP';
  specialty?: string;
  hireDate: Date;
}

// For testing purposes, you can initialize with sample data:
const sampleProvider: Provider = {
  name: "Dr. Smith",
  employeeId: "12345",
  providerType: "Physician",
  specialty: "Internal Medicine",
  hireDate: new Date("2023-06-01") // This can be changed for testing different scenarios
};

// Utility Functions
const formatNumber = (value: number): string => {
  if (value === undefined || value === null) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return '$0.00';
  
  // Force en-US locale and fixed decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Constants
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const baseMonthlyData = Object.fromEntries(months.map((m) => [m.toLowerCase(), 400]));
const targetMonthlyData = Object.fromEntries(months.map((m) => [m.toLowerCase(), 417]));

// Define baseGridConfig once with all needed properties
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

// Custom Styles for Improved Appearance
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

  .ag-row[row-index="0"] .ag-cell,  /* wRVU Generation row */
  .ag-row[row-index="3"] .ag-cell { /* wRVU Target row - updated index */
    background-color: #f1f5f9 !important;
    font-weight: 600;
  }

  /* Remove specific styling for Target wRVUs */
  .ag-row[row-index="4"] .ag-cell {
    background-color: transparent !important;
    font-weight: normal;
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

// Calculation Functions
const calculateTotalWRVUs = (baseData: any, adjustments: any[]) => {
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
  
  result.ytd = months.reduce((sum, month) => 
    sum + (result[month.toLowerCase()] || 0), 0
  );
  
  return result;
};

const calculateVariance = (totalWRVUs: any, targetData: any) => {
  const result: any = {};
  
  // Ensure both inputs are objects
  if (!totalWRVUs || !targetData) {
    return result;
  }

  // Calculate variance for each month
  months.forEach((month) => {
    const monthKey = month.toLowerCase();
    const actualValue = Number(totalWRVUs[monthKey]) || 0;
    const targetValue = Number(targetData[monthKey]) || 0;
    result[monthKey] = actualValue - targetValue;
  });

  // Calculate YTD variance
  result.ytd = months.reduce((sum, month) => {
    const monthKey = month.toLowerCase();
    return sum + (result[monthKey] || 0);
  }, 0);

  return result;
};

const calculateIncentive = (variance: number, conversionFactor: number): number => {
  // Only calculate incentive for positive variance
  return variance > 0 ? variance * conversionFactor : 0;
};

// Make sure this function is defined before it's used
const calculateMonthlyVariances = (actualData: any, targetData: any) => {
  const variances: { [key: string]: number } = {};
  
  months.forEach(month => {
    const monthKey = month.toLowerCase();
    const actualValue = actualData[monthKey] || 0;
    const targetValue = targetData[monthKey] || 0;
    variances[monthKey] = actualValue - targetValue;
  });
  
  // Calculate YTD variance
  variances.ytd = actualData.ytd - targetData.ytd;
  return variances;
};

// Add this utility function near the other calculation functions
const calculateHoldback = () => {
  // Get the compensation data
  const compensationData = getCompensationData();
  
  // Find the Holdback row and get its YTD value
  const holdbackRow = compensationData.find(row => row.component === 'Holdback (20%)');
  const holdbackYTD = holdbackRow?.ytd || 0;

  return {
    amount: Math.abs(holdbackYTD), // Make sure it's a positive number for display
    total: holdbackYTD,
    percentage: 20 // Always 20%
  };
};

// Add this function alongside other calculation functions
const calculateTotalTargets = (baseTargetData: any, targetAdjustments: any[]) => {
  const result = { ...baseTargetData };
  
  // Calculate monthly totals
  months.forEach(month => {
    const monthKey = month.toLowerCase();
    const adjustmentSum = targetAdjustments.reduce((sum, adj) => {
      const value = adj[monthKey];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    
    result[monthKey] = (result[monthKey] || 0) + adjustmentSum;
  });
  
  // Calculate YTD as sum of all months
  result.ytd = months.reduce((sum, month) => 
    sum + (result[month.toLowerCase()] || 0), 0
  );
  
  return result;
};

// Summary Card Component
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

// Create a popup cell editor component
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

// Component Implementation
const calculateTotalIncentives = (variances: any, conversionFactor: number): number => {
  return months.reduce((total, month) => {
    const monthKey = month.toLowerCase();
    const variance = variances[monthKey];
    // Only add positive variances
    const monthlyIncentive = variance > 0 ? variance * conversionFactor : 0;
    return total + monthlyIncentive;
  }, 0);
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
  const [rowData, setRowData] = useState<any[]>([]);
  const [testValues, setTestValues] = useState(Object.fromEntries(months.map(m => [m.toLowerCase(), 0])));
  const [wrvuAdjustments, setWrvuAdjustments] = useState([]);
  const [showTestRow, setShowTestRow] = useState(true);
  const [currentCF, setCurrentCF] = useState(provider?.conversionFactor || 45.00);
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const [newSalary, setNewSalary] = useState<number>(0);
  const [newFTE, setNewFTE] = useState(1.0);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  
  // Add gridApi ref
  const gridApi = useRef<any>(null);

  // Add this handler for the grid ready event
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

    // Make sure to reset all the state
    setIsCompChangeModalOpen(false);  // Close the modal
    setEditingChangeId(null);        // Reset editing state
    setCurrentSalary(0);             // Reset form values
    setNewSalary(0);
    setCurrentFTE(0);
    setNewFTE(0);
    setCurrentCF(45.00);
    setEffectiveDate('');
    setChangeReason('');
  };

  const handleOpenAdjustmentModal = (type: 'wrvu' | 'target' | 'additionalPay') => {
    setAdjustmentType(type);
    setIsAdjustmentModalOpen(true);
  };

  // Data for Metrics Table
  const getRowData = () => {
    // Calculate YTD for actual wRVUs including adjustments
    const calculateYTD = (baseData: any, adjustmentRows: any[]) => {
      let ytd = 0;
      months.forEach(month => {
        const monthKey = month.toLowerCase();
        // Add base value
        ytd += Number(baseData[monthKey]) || 0;
        // Add adjustments
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

  // Calculate values for both the grid and summary cards
  const totalWRVUs = calculateTotalWRVUs(baseMonthlyData, adjustments);
  const monthlyVariances = calculateMonthlyVariances(totalWRVUs, targetMonthlyData);
  const totalIncentives = calculateTotalIncentives(monthlyVariances, provider.conversionFactor);
  const ytdWRVUs = totalWRVUs.ytd;

  // Data for Compensation Table
  const getCompensationData = () => {
    const baseSalaryMonthly = provider.annualSalary / 12;
    
    // Get the total WRVUs including adjustments
    const totalWRVUsWithAdjustments = calculateTotalWRVUs(baseMonthlyData, adjustments);
    
    // Calculate variances against target
    const monthlyVariances = calculateVariance(totalWRVUsWithAdjustments, targetMonthlyData);
    
    // Calculate incentive based on variances
    const monthlyIncentives = {};
    let totalIncentive = 0;

    months.forEach(month => {
      const monthKey = month.toLowerCase();
      const incentive = calculateIncentive(monthlyVariances[monthKey], provider.conversionFactor);
      monthlyIncentives[monthKey] = incentive;
      totalIncentive += incentive;
    });

    const holdback = totalIncentive * 0.2;
    const netIncentive = totalIncentive - holdback;

    // Calculate total compensation for each month
    const totalCompensation = months.reduce((acc, month) => {
      const monthKey = month.toLowerCase();
      const monthlyTotal = baseSalaryMonthly + 
        (monthlyIncentives[monthKey] || 0) * 0.8 + // Net incentive (after holdback)
        (additionalPayments.reduce((sum, payment) => sum + (payment[monthKey] || 0), 0)); // Additional payments
      return { ...acc, [monthKey]: monthlyTotal };
    }, {});

    return [
      // Base Salary
      {
        component: 'Base Salary',
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: baseSalaryMonthly
        }), {}),
        ytd: provider.annualSalary
      },
      // Additional Payments
      ...additionalPayments.map(payment => ({
        component: payment.name,
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: payment[month.toLowerCase()] || 0
        }), {}),
        ytd: Object.keys(payment)
          .filter(key => months.map(m => m.toLowerCase()).includes(key))
          .reduce((sum, month) => sum + (payment[month] || 0), 0)
      })),
      // Incentive
      {
        component: 'Incentive (100%)',
        ...monthlyIncentives,
        ytd: totalIncentive
      },
      // Holdback
      {
        component: 'Holdback (20%)',
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: -(monthlyIncentives[month.toLowerCase()] || 0) * 0.2
        }), {}),
        ytd: -holdback
      },
      // Net Incentive
      {
        component: 'Net Incentive (80%)',
        ...months.reduce((acc, month) => ({
          ...acc,
          [month.toLowerCase()]: (monthlyIncentives[month.toLowerCase()] || 0) * 0.8
        }), {}),
        ytd: netIncentive
      },
      // Total Compensation
      {
        component: 'Total Comp.',
        ...totalCompensation,
        ytd: provider.annualSalary + netIncentive + 
             additionalPayments.reduce((sum, payment) => 
               sum + Object.keys(payment)
                 .filter(key => months.map(m => m.toLowerCase()).includes(key))
                 .reduce((monthSum, month) => monthSum + (payment[month] || 0), 0), 0)
      }
    ];
  };

  // This is the function being called from the modal
  const handleAddAdjustment = (data: any) => {
    if (isEditing && editingPayment) {
      // Handle edit - preserve the component name and update values
      setAdditionalPayments(prev => 
        prev.map(payment => 
          payment.component === editingPayment.component 
            ? { 
                ...payment, // Preserve existing properties
                ...data,    // Update with new values
                component: payment.component // Ensure component name stays the same
              } 
            : payment
        )
      );
    } else {
      // Handle new addition (existing logic)
      if (data.type === 'additionalPay') {
        setAdditionalPayments(prev => [...prev, { ...data, component: data.name }]);
      }
      // ... rest of your existing add logic
    }
    
    setIsAdjustmentModalOpen(false);
    setIsEditing(false);
    setEditingPayment(null);
  };

  const handleRemoveAdjustment = (id: string) => {
    setAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  const handleRemoveTargetAdjustment = (id: string) => {
    setTargetAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  // Metrics Table Column Definitions
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
              <button
                onClick={() => handleDeleteAdjustment(params.data)}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Delete adjustment"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
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

        // Variance row styling
        if (params.data.metric === 'Variance') {
          const value = Number(params.value);
          return {
            ...baseStyle,
            backgroundColor: value > 0 ? '#dcfce7' : value < 0 ? '#fee2e2' : 'transparent',
            color: value > 0 ? '#15803d' : value < 0 ? '#dc2626' : 'inherit',
            fontWeight: '600'
          };
        }

        // Bold specific rows
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
                prev.map(adj => 
                  adj.id === params.data.id 
                    ? { ...adj, [params.column.colId]: newValue }
                    : adj
                )
              );
            } else if (params.data.type === 'target') {
              setTargetAdjustments(prev => 
                prev.map(adj => 
                  adj.id === params.data.id 
                    ? { ...adj, [params.column.colId]: newValue }
                    : adj
                )
              );
            }
            return true;
          }
        }
        return false;
      }
    })),
    // Add YTD column with comma after it
    {
      field: 'ytd',
      headerName: 'YTD',
      minWidth: 130,
      headerClass: 'ag-right-aligned-header',
      cellStyle: (params: any) => {
        const baseStyle = { 
          textAlign: 'right',
          paddingRight: '24px', // Match December column padding
          display: 'flex',
          justifyContent: 'flex-end', // Align content to the right
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

  // First, add the delete handler function
  const handleDeleteAdditionalPay = (paymentName: string) => {
    setAdditionalPayments(prev => prev.filter(payment => payment.name !== paymentName));
  };

  // Then modify your compensationColumnDefs
  const handleRemoveAdditionalPay = (payName: string) => {
    setAdditionalPayments(prev => prev.filter(p => p.name !== payName));
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
                               params.data.component !== 'Total Comp.';

        if (isAdditionalPay) {
          return (
            <div className="flex items-center justify-between">
              <span>{params.value}</span>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAdditionalPay(params.data);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAdjustment(params.data);
                  }}
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
      cellStyle: params => ({
        textAlign: 'right',
        fontWeight: params.data.component === 'Total Comp.' ? '600' : 'normal'
      })
    })),
    // Add YTD column
    {
      field: 'ytd',
      headerName: 'YTD',
      valueGetter: (params: any) => {
        return months.reduce((sum, month) => {
          return sum + (params.data[month.toLowerCase()] || 0);
        }, 0);
      },
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: params => ({
        textAlign: 'right',
        fontWeight: params.data.component === 'Total Comp.' ? '600' : 'normal'
      })
    }
  ];

  // Add these calculations near the top of your component
  const getCurrentMonthData = () => {
    const currentMonth = new Date().getMonth(); // 0-11 for Jan-Dec
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const currentMonthName = monthNames[currentMonth];

    // Get current month's wRVUs from your data
    const currentMonthWRVUs = getRowData().find(row => row.metric === 'Total wRVUs')?.[currentMonthName] || 0;
    const currentMonthTarget = getRowData().find(row => row.metric === 'Total Target')?.[currentMonthName] || 0;

    return { currentMonthWRVUs, currentMonthTarget };
  };

  // Get the data for all months for the chart
  const getChartData = () => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const wrvuData = getRowData().find(row => row.metric === 'Total wRVUs');
    const targetData = getRowData().find(row => row.metric === 'Total Target');

    const actualWRVUs = months.map(month => wrvuData?.[month] || 0);
    const targetWRVUs = months.map(month => targetData?.[month] || 0);

    return { actualWRVUs, targetWRVUs };
  };

  // Add this function to calculate totals from your existing table data
  const getMetricTotals = () => {
    const rowData = getRowData();
    
    // Monthly wRVUs vs Target
    const currentMonth = new Date().getMonth();
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const currentMonthName = monthNames[currentMonth];

    // Get data from your existing rows
    const wrvuRow = rowData.find(row => row.metric === 'Total wRVUs');
    const targetRow = rowData.find(row => row.metric === 'Total Target');
    const incentiveRow = rowData.find(row => row.metric === 'Incentive');
    const holdbackRow = rowData.find(row => row.metric === 'Holdback');

    return {
      monthlyWRVUs: {
        actual: wrvuRow?.[currentMonthName] || 0,
        target: targetRow?.[currentMonthName] || 0,
      },
      ytdWRVUs: {
        actual: wrvuRow?.ytd || 0,
        target: targetRow?.ytd || 0,
      },
      incentive: {
        actual: incentiveRow?.ytd || 0,
        target: targetRow?.ytd * 0.1 || 0, // Assuming 10% incentive target
      },
      holdback: {
        actual: Math.abs(holdbackRow?.ytd || 0),
        target: targetRow?.ytd * 0.05 || 0, // Assuming 5% holdback target
      }
    };
  };

  const calculatePlanYearProgress = () => {
    const rowData = getRowData();
    const actualWRVUsRow = rowData.find(row => row.metric === 'Actual wRVUs');
    
    if (!actualWRVUsRow) return { completed: 0, total: 12, percentage: 0 };
    
    // Count months with data
    const monthsWithData = months.reduce((count, month) => {
      const value = actualWRVUsRow[month.toLowerCase()];
      return value > 0 ? count + 1 : count;
    }, 0);

    return {
      completed: monthsWithData,
      total: 12,
      percentage: (monthsWithData / 12) * 100
    };
  };

  const calculateYTDTargetProgress = () => {
    const ytdWRVUs = getRowData()
      .find(row => row.metric === 'Total wRVUs')?.ytd || 0;
    const ytdTarget = getRowData()
      .find(row => row.metric === 'Total Target')?.ytd || 0;

    return {
      actual: ytdWRVUs,
      target: ytdTarget,
      percentage: ytdTarget > 0 ? (ytdWRVUs / ytdTarget) * 100 : 0
    };
  };

  const calculateIncentiveEarned = () => {
    // Get YTD values
    const actualYTD = getRowData()
      .find(row => row.metric === 'Total wRVUs')?.ytd || 0;
    const targetYTD = getRowData()
      .find(row => row.metric === 'Total Target')?.ytd || 0;
    
    // Calculate variance (actual - target)
    const variance = actualYTD - targetYTD;
    
    // Calculate incentive only if variance is positive
    const incentiveAmount = variance > 0 ? variance * provider.conversionFactor : 0;
    
    return {
      earned: incentiveAmount,
      total: provider.annualSalary,
      percentage: (incentiveAmount / provider.annualSalary) * 100
    };
  };

  const calculateHoldback = () => {
    const incentiveEarned = calculateIncentiveEarned().earned;
    const holdbackAmount = incentiveEarned * 0.2; // Assuming 20% holdback
    
    return {
      amount: holdbackAmount,
      total: incentiveEarned,
      percentage: incentiveEarned > 0 ? (holdbackAmount / incentiveEarned) * 100 : 0
    };
  };

  // Add this delete handler function
  const handleDeleteWRVUAdjustment = (id: string) => {
    setAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  // Add this function to handle PDF generation
  const handleExportPDF = async () => {
    // Set to landscape and A4
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });
    
    // Show all sections before capturing
    setIsGaugesVisible(true);
    setIsWRVUChartVisible(true);
    setIsMetricsTableVisible(true);
    setIsCompTableVisible(true);
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for state updates

    try {
      // Page 1: Header and Summary Cards
      const headerSection = document.querySelector('.dashboard-header');
      const summaryCards = document.querySelector('.summary-cards');
      const performanceMetrics = document.querySelector('.performance-metrics');

      // Add header with styling
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      await addSection(pdf, headerSection, 40, 40, 0.8);
      
      // Add summary cards row
      await addSection(pdf, summaryCards, 40, 120, 0.8);
      
      // Add performance metrics (gauges)
      await addSection(pdf, performanceMetrics, 40, 280, 0.8);

      // Page 2: Charts and Tables
      pdf.addPage();
      
      // Add wRVU chart
      const wrvuChart = document.getElementById('wrvu-chart-section');
      await addSection(pdf, wrvuChart, 40, 40, 0.8);
      
      // Page 3: Tables
      pdf.addPage();
      
      // Add metrics table
      const metricsTable = document.getElementById('metrics-table');
      await addSection(pdf, metricsTable, 40, 40, 0.75);
      
      // Add compensation table
      const compensationTable = document.getElementById('compensation-table');
      await addSection(pdf, compensationTable, 40, 400, 0.75);

      // Save the PDF
      pdf.save(`${provider.firstName}_${provider.lastName}_Dashboard.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Reset visibility states
      setIsGaugesVisible(false);
      setIsWRVUChartVisible(false);
      setIsMetricsTableVisible(false);
      setIsCompTableVisible(false);
    }
  };

  // Helper function to add a section to PDF
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

  useEffect(() => {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const metricsGrid = document.querySelector('#metrics-table .ag-root-wrapper');
      const compGrid = document.querySelector('#compensation-table .ag-root-wrapper');
      
      if (metricsGrid) {
        metricsGrid.style.width = '100%';
      }
      if (compGrid) {
        compGrid.style.width = '100%';
      }
      
      // Force grids to resize
      const metricsApi = document.querySelector('#metrics-table .ag-grid-react')?.gridApi;
      const compApi = document.querySelector('#compensation-table .ag-grid-react')?.gridApi;
      
      if (metricsApi) metricsApi.sizeColumnsToFit();
      if (compApi) compApi.sizeColumnsToFit();
    }, 100);
  }, []);

  // Add this function to handle updates to additional payments
  const handleAdditionalPayUpdate = (component: string, month: string, value: number) => {
    setAdditionalPayments(prev => prev.map(payment => {
      if (payment.name === component) {
        return {
          ...payment,
          [month]: value
        };
      }
      return payment;
    }));
  };

  // Add these helper functions to handle updates and deletions
  const handleWRVUAdjustmentUpdate = (
    id: string,
    type: 'wrvu' | 'target',
    month: string,
    value: number
  ) => {
    if (type === 'wrvu') {
      setAdjustments(prev => prev.map(adj => {
        if (adj.id === id) {
          return {
            ...adj,
            [month]: value
          };
        }
        return adj;
      }));
    } else if (type === 'target') {
      setTargetAdjustments(prev => prev.map(adj => {
        if (adj.id === id) {
          return {
            ...adj,
            [month]: value
          };
        }
        return adj;
      }));
    }
  };

  const handleRemoveMetricAdjustment = (id: string, type: 'wrvu' | 'target') => {
    if (type === 'wrvu') {
      setAdjustments(prev => prev.filter(adj => adj.id !== id));
    } else if (type === 'target') {
      setTargetAdjustments(prev => prev.filter(adj => adj.id !== id));
    }
  };

  const handleDeleteCompensationChange = (id: string) => {
    setCompensationHistory(prev => prev.filter(change => change.id !== id));
  };

  // Simplify the edit handler
  const handleEditCompensationChange = (change: CompensationChange) => {
    setIsCompChangeModalOpen(true);
    setEditingChangeId(change.id);
    
    // Set all the values from the existing change record
    setCurrentSalary(change.previousSalary);
    setNewSalary(change.newSalary);
    setCurrentFTE(change.previousFTE);
    setNewFTE(change.newFTE);
    setCurrentCF(change.conversionFactor || 45.00);
    setEffectiveDate(change.effectiveDate);
    setChangeReason(change.reason || '');
  };

  const handleCellValueChange = (params: any) => {
    if (params.data.type === 'adjustment') {
      const newValue = Number(params.newValue);
      if (!isNaN(newValue)) {
        setTestValues(prev => ({
          ...prev,
          [params.column.colId]: newValue
        }));
      }
    }
  };

  const handleDeleteTest = () => {
    setShowTestRow(false);
    setTestValues(Object.fromEntries(months.map(m => [m.toLowerCase(), 0]))); // Reset values
  };

  const handleDeleteAdjustment = (paymentToDelete: any) => {
    // Add confirmation dialog
    if (window.confirm('Are you sure you want to delete this additional pay?')) {
      setAdditionalPayments(prev => 
        prev.filter(payment => payment.component !== paymentToDelete.component)
      );
    }
  };

  // When opening the modal, make sure to pass the current FTE
  const handleOpenCompChangeModal = () => {
    setIsCompChangeModalOpen(true);
    setCurrentFTE(provider?.fte || 1.0); // Set the current FTE from provider data
  };

  // Add this CSS to your global styles or component styles
  const gridStyles = `
    .ag-cell-vertically-aligned {
      line-height: 48px !important;  // Match the rowHeight
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }
    .ag-header-cell-right .ag-header-cell-label {
      justify-content: flex-end;
      padding-right: 16px;
    }
  `;

  // Add the styles to your component
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = gridStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Add this new handler function
  const handleEditAdditionalPay = (payment: any) => {
    setIsEditing(true);
    setEditingPayment(payment);
    setIsAdjustmentModalOpen(true);
  };

  return (
    <>
      <div className="max-w-full px-8">
        <style>{customStyles}</style>
        {/* Header Section with Provider Info */}
        <div className="dashboard-header bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="px-6 pt-6">
            <div className="flex justify-between items-start">
              <div className="text-center flex-1">
                {/* Provider Name and Specialty */}
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  John Smith, MD <span className="text-gray-600">- Specialty: Cardiology</span>
                </h1>

                {/* Dashboard Title */}
                <div className="text-gray-600 mb-3">
                  Provider Compensation Dashboard
                </div>

                {/* ID and FTE */}
                <div className="text-gray-600 text-sm">
                  Employee ID: EMP123 <span className="mx-3">•</span> FTE: 1.0
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Tab Navigation */}
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
              className={`${
                activeView === 'control'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center px-3 py-2 text-sm font-medium border-b-2`}
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Control Panel
            </button>
          </nav>
        </div>

        {/* Summary Cards - Always Visible */}
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

        {/* Conditional Content Based on Active Tab */}
        <div className="transition-all duration-300 ease-in-out">
          {activeView === 'compensation' ? (
            // wRVUs & Comp View
            <div className="space-y-8">
              {/* Metrics & Adjustments Table */}
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
                      onCellValueChanged={handleCellValueChange}
                    />
                  </div>
                </div>
              </div>

              {/* Compensation Details Table */}
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
                      columnDefs={compensationColumnDefs}
                      rowData={getCompensationData()}
                      onGridReady={(params) => {
                        if (params.api) {
                          params.api.sizeColumnsToFit();
                        }
                      }}
                      onGridSizeChanged={(params) => {
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
            // Charts & Stats View
            <div className="space-y-8">
              {/* Performance Metrics Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <h2 className="text-xl font-medium text-center py-4 border-b border-gray-200">
                  Performance Metrics
                </h2>
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="flex flex-col items-center">
                      <WRVUGauge 
                        title="Plan Year Progress" 
                        value={calculatePlanYearProgress().percentage}
                        subtitle={`${calculatePlanYearProgress().completed} of ${calculatePlanYearProgress().total} months`}
                        size="large"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <WRVUGauge 
                        title="Target Progress" 
                        value={calculateYTDTargetProgress().percentage}
                        subtitle={`${formatNumber(calculateYTDTargetProgress().actual)} of ${formatNumber(calculateYTDTargetProgress().target)}`}
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

              {/* wRVU Performance Chart */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <h2 className="text-xl font-medium text-center py-4 border-b border-gray-200">
                  wRVU Performance
                </h2>
                <div className="p-6">
                  <WRVUChart 
                    actualWRVUs={getChartData().actualWRVUs}
                    targetWRVUs={getChartData().targetWRVUs}
                    months={months}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Control Panel View
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium">Compensation Management</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Column */}
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

                    {/* Second Column */}
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

                  {/* Second Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* wRVU Adjustments */}
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

                    {/* Target Adjustments */}
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

                  {/* Compensation History */}
                  <div className="mt-8">
                    <CompensationHistory 
                      changes={compensationHistory} 
                      onDelete={handleDeleteCompensationChange}
                      onEdit={handleEditCompensationChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal rendered at root level */}
      <AddAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setIsEditing(false);
          setEditingPayment(null);
        }}
        onAdd={handleAddAdjustment}
        type={adjustmentType}
        editingData={editingPayment}  // This will be undefined for new additions
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
        currentCF={currentCF}
        effectiveDate={effectiveDate}
        reason={changeReason}
        editingChange={editingChangeId ? compensationHistory.find(c => c.id === editingChangeId) : undefined}
      />
    </>
  );
};

export default ProviderDashboard;
