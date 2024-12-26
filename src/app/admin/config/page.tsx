'use client';

import { useState } from 'react';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const configCategories = [
  {
    id: 'compensation',
    name: 'Compensation Settings',
    icon: CurrencyDollarIcon,
    settings: [
      {
        id: 'base_wrvu_rate',
        name: 'Base wRVU Rate',
        description: 'Default wRVU conversion factor for new providers',
        type: 'number',
        value: '45.00',
        validation: {
          min: 0,
          step: '0.01'
        }
      },
      {
        id: 'default_holdback',
        name: 'Default Holdback Percentage',
        description: 'Default holdback percentage for incentive payments',
        type: 'number',
        value: '20',
        validation: {
          min: 0,
          max: 100,
          step: '1'
        }
      }
    ]
  },
  {
    id: 'targets',
    name: 'Target Configuration',
    icon: ChartBarIcon,
    settings: [
      {
        id: 'target_calculation',
        name: 'Target Calculation Method',
        description: 'How provider targets are calculated',
        type: 'select',
        value: 'annual',
        options: [
          { label: 'Annual Fixed', value: 'annual' },
          { label: 'Quarterly Adjusted', value: 'quarterly' },
          { label: 'Monthly Rolling', value: 'monthly' }
        ]
      },
      {
        id: 'target_adjustment',
        name: 'Target Adjustment Threshold',
        description: 'Percentage threshold for automatic target adjustments',
        type: 'number',
        value: '10',
        validation: {
          min: 0,
          max: 100,
          step: '1'
        }
      }
    ]
  },
  {
    id: 'scheduling',
    name: 'Scheduling & Periods',
    icon: CalendarIcon,
    settings: [
      {
        id: 'fiscal_year_start',
        name: 'Fiscal Year Start Month',
        description: 'Month when the fiscal year begins',
        type: 'select',
        value: '1',
        options: [
          { label: 'January', value: '1' },
          { label: 'July', value: '7' },
          { label: 'October', value: '10' }
        ]
      },
      {
        id: 'payment_schedule',
        name: 'Incentive Payment Schedule',
        description: 'When incentive payments are calculated and distributed',
        type: 'select',
        value: 'quarterly',
        options: [
          { label: 'Monthly', value: 'monthly' },
          { label: 'Quarterly', value: 'quarterly' },
          { label: 'Semi-Annual', value: 'semi-annual' },
          { label: 'Annual', value: 'annual' }
        ]
      }
    ]
  },
  {
    id: 'departments',
    name: 'Department Settings',
    icon: BuildingOfficeIcon,
    settings: [
      {
        id: 'department_grouping',
        name: 'Department Grouping',
        description: 'How departments are grouped for reporting',
        type: 'select',
        value: 'specialty',
        options: [
          { label: 'By Specialty', value: 'specialty' },
          { label: 'By Location', value: 'location' },
          { label: 'By Division', value: 'division' }
        ]
      },
      {
        id: 'department_targets',
        name: 'Department Target Setting',
        description: 'How department-level targets are set',
        type: 'select',
        value: 'aggregate',
        options: [
          { label: 'Aggregate of Providers', value: 'aggregate' },
          { label: 'Independent', value: 'independent' },
          { label: 'Hybrid', value: 'hybrid' }
        ]
      }
    ]
  }
];

export default function ConfigPage() {
  const [config, setConfig] = useState(configCategories);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfigChange = (categoryId: string, settingId: string, value: any) => {
    setConfig(prevConfig => 
      prevConfig.map(category => 
        category.id === categoryId
          ? {
              ...category,
              settings: category.settings.map(setting =>
                setting.id === settingId
                  ? { ...setting, value }
                  : setting
              )
            }
          : category
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert config to the format expected by the API
      const configData = config.reduce((acc, category) => {
        category.settings.forEach(setting => {
          acc[setting.id] = setting.value;
        });
        return acc;
      }, {} as Record<string, any>);

      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) throw new Error('Failed to save configuration');
      
      // Show success message
      alert('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        <p className="mt-2 text-base text-gray-600">
          Configure system-wide settings and defaults.
        </p>
      </div>

      <div className="space-y-6">
        {config.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <category.icon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">{category.name}</h2>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              {category.settings.map((setting) => (
                <div key={setting.id} className="flex items-start justify-between">
                  <div className="flex-1 pr-8">
                    <label
                      htmlFor={setting.id}
                      className="block text-sm font-medium text-gray-900"
                    >
                      {setting.name}
                    </label>
                    <p className="mt-1 text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {setting.type === 'select' ? (
                      <select
                        id={setting.id}
                        value={setting.value}
                        onChange={(e) => handleConfigChange(category.id, setting.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {setting.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : setting.type === 'number' ? (
                      <input
                        type="number"
                        id={setting.id}
                        value={setting.value}
                        onChange={(e) => handleConfigChange(category.id, setting.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        {...setting.validation}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
} 