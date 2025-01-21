'use client';

import { useState } from 'react';
import { 
  BellIcon,
  EnvelopeIcon,
  UserIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface Setting {
  id: string;
  name: string;
  description: string;
  type: 'toggle' | 'select' | 'input';
  value: any;
  options?: { label: string; value: string }[];
}

const settingCategories = [
  {
    id: 'notifications',
    name: 'Notifications',
    icon: BellIcon,
    settings: [
      {
        id: 'email_notifications',
        name: 'Email Notifications',
        description: 'Receive email notifications for important updates',
        type: 'toggle',
        value: true
      },
      {
        id: 'notification_frequency',
        name: 'Notification Frequency',
        description: 'How often you want to receive notifications',
        type: 'select',
        value: 'daily',
        options: [
          { label: 'Real-time', value: 'realtime' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' }
        ]
      }
    ]
  },
  {
    id: 'display',
    name: 'Display & Appearance',
    icon: PaintBrushIcon,
    settings: [
      {
        id: 'theme',
        name: 'Theme',
        description: 'Choose your preferred color theme',
        type: 'select',
        value: 'light',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'System', value: 'system' }
        ]
      },
      {
        id: 'default_view',
        name: 'Default View',
        description: 'Choose your default dashboard view',
        type: 'select',
        value: 'monthly',
        options: [
          { label: 'Monthly', value: 'monthly' },
          { label: 'Quarterly', value: 'quarterly' },
          { label: 'Yearly', value: 'yearly' }
        ]
      }
    ]
  },
  {
    id: 'localization',
    name: 'Localization',
    icon: GlobeAltIcon,
    settings: [
      {
        id: 'date_format',
        name: 'Date Format',
        description: 'Choose your preferred date format',
        type: 'select',
        value: 'MM/DD/YYYY',
        options: [
          { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
          { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
          { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
        ]
      },
      {
        id: 'timezone',
        name: 'Time Zone',
        description: 'Set your local time zone',
        type: 'select',
        value: 'America/New_York',
        options: [
          { label: 'Eastern Time', value: 'America/New_York' },
          { label: 'Central Time', value: 'America/Chicago' },
          { label: 'Mountain Time', value: 'America/Denver' },
          { label: 'Pacific Time', value: 'America/Los_Angeles' }
        ]
      }
    ]
  },
  {
    id: 'security',
    name: 'Security',
    icon: ShieldCheckIcon,
    settings: [
      {
        id: 'two_factor',
        name: 'Two-Factor Authentication',
        description: 'Enable two-factor authentication for added security',
        type: 'toggle',
        value: false
      },
      {
        id: 'session_timeout',
        name: 'Session Timeout',
        description: 'Set the duration before automatic logout',
        type: 'select',
        value: '30',
        options: [
          { label: '15 minutes', value: '15' },
          { label: '30 minutes', value: '30' },
          { label: '1 hour', value: '60' },
          { label: '4 hours', value: '240' }
        ]
      }
    ]
  }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(settingCategories);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (categoryId: string, settingId: string, value: any) => {
    setSettings(prevSettings => 
      prevSettings.map(category => 
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
      // Convert settings to the format expected by the API
      const settingsData = settings.reduce((acc, category) => {
        category.settings.forEach(setting => {
          acc[setting.id] = setting.value;
        });
        return acc;
      }, {} as Record<string, any>);

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      // Show success message
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-base text-gray-600">
          Manage your preferences and system settings.
        </p>
      </div>

      <div className="space-y-6">
        {settings.map((category) => (
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
                    {setting.type === 'toggle' ? (
                      <button
                        type="button"
                        className={`${
                          setting.value ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        onClick={() => handleSettingChange(category.id, setting.id, !setting.value)}
                      >
                        <span
                          className={`${
                            setting.value ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                    ) : setting.type === 'select' ? (
                      <select
                        id={setting.id}
                        value={setting.value}
                        onChange={(e) => handleSettingChange(category.id, setting.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {setting.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
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