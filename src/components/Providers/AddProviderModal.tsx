'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FormData {
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
  baseSalary: string;
  compensationModel: string;
}

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  provider?: Partial<FormData>;
  mode?: 'add' | 'edit';
}

export default function AddProviderModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  provider,
  mode = 'add' 
}: AddProviderModalProps) {
  const [formData, setFormData] = useState<FormData>({
    id: '',
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    specialty: '',
    department: '',
    status: 'Active',
    hireDate: '',
    fte: 1.0,
    baseSalary: '',
    compensationModel: 'Base Pay'
  });

  // Update form data when provider changes or modal opens
  useEffect(() => {
    if (provider && mode === 'edit') {
      setFormData({
        id: provider.id || '',
        employeeId: provider.employeeId || '',
        firstName: provider.firstName || '',
        lastName: provider.lastName || '',
        email: provider.email || '',
        specialty: provider.specialty || '',
        department: provider.department || '',
        status: provider.status || 'Active',
        hireDate: provider.hireDate ? new Date(provider.hireDate).toISOString().split('T')[0] : '',
        fte: provider.fte || 1.0,
        baseSalary: provider.baseSalary?.toString() || '',
        compensationModel: provider.compensationModel || 'Base Pay'
      });
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        id: '',
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        specialty: '',
        department: '',
        status: 'Active',
        hireDate: '',
        fte: 1.0,
        baseSalary: '',
        compensationModel: 'Base Pay'
      });
    }
  }, [provider, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting provider:', error);
      alert('Failed to submit provider. Please try again.');
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {mode === 'add' ? 'Add New Provider' : 'Edit Provider'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">First Name</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Name</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Specialty</label>
                          <select
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.specialty}
                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          >
                            <option value="">Select Specialty</option>
                            <option value="Allergy and Immunology">Allergy and Immunology</option>
                            <option value="Anesthesiology">Anesthesiology</option>
                            <option value="Bone Marrow Transplant">Bone Marrow Transplant</option>
                            <option value="Cardiology">Cardiology</option>
                            <option value="Cardiothoracic Surgery">Cardiothoracic Surgery</option>
                            <option value="Critical Care Medicine">Critical Care Medicine</option>
                            <option value="Critical Care Medicine - Cardiology">Critical Care Medicine - Cardiology</option>
                            <option value="Dermatology">Dermatology</option>
                            <option value="Developmental-Behavioral Medicine">Developmental-Behavioral Medicine</option>
                            <option value="Emergency Medicine">Emergency Medicine</option>
                            <option value="Endocrinology">Endocrinology</option>
                            <option value="Gastroenterology">Gastroenterology</option>
                            <option value="General">General</option>
                            <option value="General Surgery">General Surgery</option>
                            <option value="Genetics">Genetics</option>
                            <option value="Gynecology">Gynecology</option>
                            <option value="Hematology and Oncology">Hematology and Oncology</option>
                            <option value="Hospitalist">Hospitalist</option>
                            <option value="Infectious Disease">Infectious Disease</option>
                            <option value="Internal Medicine">Internal Medicine</option>
                            <option value="Neonatal-Perinatal Medicine">Neonatal-Perinatal Medicine</option>
                            <option value="Nephrology">Nephrology</option>
                            <option value="Neurology">Neurology</option>
                            <option value="Neurological Surgery">Neurological Surgery</option>
                            <option value="Ophthalmology">Ophthalmology</option>
                            <option value="Orthopedic Surgery">Orthopedic Surgery</option>
                            <option value="Otolaryngology">Otolaryngology</option>
                            <option value="Pathology">Pathology</option>
                            <option value="Physical Medicine and Rehabilitation">Physical Medicine and Rehabilitation</option>
                            <option value="Plastic and Reconstructive Surgery">Plastic and Reconstructive Surgery</option>
                            <option value="Psychiatry - Child and Adolescent">Psychiatry - Child and Adolescent</option>
                            <option value="Pulmonology">Pulmonology</option>
                            <option value="Radiology">Radiology</option>
                            <option value="Radiology - Interventional">Radiology - Interventional</option>
                            <option value="Rheumatology">Rheumatology</option>
                            <option value="Sports Medicine - Medical">Sports Medicine - Medical</option>
                            <option value="Urgent Care">Urgent Care</option>
                            <option value="Urology">Urology</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                          <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.hireDate}
                            onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">FTE</label>
                          <input
                            type="number"
                            required
                            step="0.1"
                            min="0"
                            max="1"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.fte}
                            onChange={(e) => setFormData({ ...formData, fte: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                          <input
                            type="text"
                            required
                            pattern="[0-9]*"
                            min="0"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.baseSalary}
                            onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Compensation Model</label>
                          <select
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.compensationModel}
                            onChange={(e) => setFormData({ ...formData, compensationModel: e.target.value })}
                          >
                            <option value="Base Pay">Base Pay</option>
                            <option value="Custom">Custom</option>
                            <option value="Standard">Standard</option>
                            <option value="Tiered CF">Tiered CF</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                        >
                          {mode === 'add' ? 'Add Provider' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 