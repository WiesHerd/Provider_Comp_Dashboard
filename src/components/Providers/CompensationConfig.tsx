'use client';

import { useState, useEffect } from 'react';
import { ProviderCompensation, CompensationModel } from '@/types/market-data';

interface CompensationConfigProps {
  providerId: string;
  onSave: (config: ProviderCompensation) => void;
  initialData?: ProviderCompensation;
}

export default function CompensationConfig({
  providerId,
  onSave,
  initialData
}: CompensationConfigProps) {
  const [config, setConfig] = useState<ProviderCompensation>({
    id: initialData?.id || '',
    providerId,
    baseSalary: initialData?.baseSalary || 0,
    specialty: initialData?.specialty || '',
    baseConversionFactor: initialData?.baseConversionFactor || 0,
    tieredConversionFactors: initialData?.tieredConversionFactors || [],
    customTargets: initialData?.customTargets || [],
    yearlyTarget: initialData?.yearlyTarget,
    monthlyTarget: initialData?.monthlyTarget
  });

  const [model, setModel] = useState<CompensationModel>(
    config.tieredConversionFactors?.length ? 'tiered' :
    config.customTargets?.length ? 'custom' : 'standard'
  );

  // Calculate targets when base values change
  useEffect(() => {
    if (model === 'standard' && config.baseSalary && config.baseConversionFactor) {
      const yearly = config.baseSalary / config.baseConversionFactor;
      setConfig(prev => ({
        ...prev,
        yearlyTarget: yearly,
        monthlyTarget: yearly / 12,
        customTargets: []
      }));
    }
  }, [config.baseSalary, config.baseConversionFactor, model]);

  const handleAddTier = () => {
    setConfig(prev => ({
      ...prev,
      tieredConversionFactors: [
        ...(prev.tieredConversionFactors || []),
        { threshold: 0, cf: 0 }
      ]
    }));
  };

  const handleAddCustomTarget = () => {
    setConfig(prev => ({
      ...prev,
      customTargets: [
        ...(prev.customTargets || []),
        { month: 1, target: 0 }
      ]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Base Salary</label>
          <input
            type="number"
            value={config.baseSalary}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              baseSalary: Number(e.target.value)
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Specialty</label>
          <input
            type="text"
            value={config.specialty}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              specialty: e.target.value
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Compensation Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Compensation Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as CompensationModel)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="standard">Standard (Base/CF)</option>
          <option value="custom">Custom Targets</option>
          <option value="tiered">Tiered CF</option>
        </select>
      </div>

      {/* Base Conversion Factor */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Base Conversion Factor</label>
        <input
          type="number"
          value={config.baseConversionFactor}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            baseConversionFactor: Number(e.target.value)
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Tiered Conversion Factors */}
      {model === 'tiered' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Tiered Conversion Factors</h3>
            <button
              type="button"
              onClick={handleAddTier}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Tier
            </button>
          </div>
          {config.tieredConversionFactors?.map((tier, index) => (
            <div key={index} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Percentile Threshold</label>
                <input
                  type="number"
                  value={tier.threshold}
                  onChange={(e) => {
                    const newTiers = [...(config.tieredConversionFactors || [])];
                    newTiers[index].threshold = Number(e.target.value);
                    setConfig(prev => ({
                      ...prev,
                      tieredConversionFactors: newTiers
                    }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Conversion Factor</label>
                <input
                  type="number"
                  value={tier.cf}
                  onChange={(e) => {
                    const newTiers = [...(config.tieredConversionFactors || [])];
                    newTiers[index].cf = Number(e.target.value);
                    setConfig(prev => ({
                      ...prev,
                      tieredConversionFactors: newTiers
                    }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Monthly Targets */}
      {model === 'custom' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Custom Monthly Targets</h3>
            <button
              type="button"
              onClick={handleAddCustomTarget}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Target
            </button>
          </div>
          {config.customTargets?.map((target, index) => (
            <div key={index} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Month</label>
                <select
                  value={target.month}
                  onChange={(e) => {
                    const newTargets = [...(config.customTargets || [])];
                    newTargets[index].month = Number(e.target.value);
                    setConfig(prev => ({
                      ...prev,
                      customTargets: newTargets
                    }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Target wRVUs</label>
                <input
                  type="number"
                  value={target.target}
                  onChange={(e) => {
                    const newTargets = [...(config.customTargets || [])];
                    newTargets[index].target = Number(e.target.value);
                    setConfig(prev => ({
                      ...prev,
                      customTargets: newTargets
                    }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSave(config)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
} 