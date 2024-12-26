'use client';

import { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  UserPlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { UsersIcon } from '@heroicons/react/24/solid';
import DepartmentModal from '@/components/Departments/DepartmentModal';
import DeleteDepartmentModal from '@/components/Departments/DeleteDepartmentModal';
import AssignProvidersModal from '@/components/Departments/AssignProvidersModal';

interface Department {
  id: string;
  name: string;
  location: string;
  providerCount: number;
  director: string;
  selected?: boolean;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: '1',
      name: 'Cardiology',
      location: 'Main Hospital',
      providerCount: 12,
      director: 'Dr. Sarah Johnson'
    },
    {
      id: '2',
      name: 'Orthopedics',
      location: 'West Wing',
      providerCount: 8,
      director: 'Dr. Michael Chen'
    },
    {
      id: '3',
      name: 'Pediatrics',
      location: "Children's Center",
      providerCount: 15,
      director: 'Dr. Emily Rodriguez'
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Toggle department selection
  const toggleDepartmentSelection = (departmentId: string) => {
    setSelectedDepartments(prev => 
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  // Toggle all departments selection
  const toggleAllDepartments = () => {
    if (selectedDepartments.length === departments.length) {
      setSelectedDepartments([]);
    } else {
      setSelectedDepartments(departments.map(d => d.id));
    }
  };

  // Bulk delete selected departments
  const handleBulkDelete = async () => {
    if (!selectedDepartments.length) return;

    if (confirm(`Are you sure you want to delete ${selectedDepartments.length} departments?`)) {
      try {
        // In a real app, make API call to delete departments
        setDepartments(prev => prev.filter(d => !selectedDepartments.includes(d.id)));
        setSelectedDepartments([]);
      } catch (error) {
        console.error('Error deleting departments:', error);
        alert('Failed to delete departments. Please try again.');
      }
    }
  };

  // Assign providers to department
  const handleAssignProviders = async (department: Department) => {
    setSelectedDepartment(department);
    setIsAssignModalOpen(true);
  };

  const handleProviderAssignment = async (providerIds: string[]) => {
    try {
      // In a real app, make API call to assign providers
      console.log(`Assigning providers ${providerIds.join(', ')} to department ${selectedDepartment?.id}`);
      // Update provider count
      if (selectedDepartment) {
        setDepartments(prev =>
          prev.map(d =>
            d.id === selectedDepartment.id
              ? { ...d, providerCount: providerIds.length }
              : d
          )
        );
      }
      setIsAssignModalOpen(false);
    } catch (error) {
      console.error('Error assigning providers:', error);
      alert('Failed to assign providers. Please try again.');
    }
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (department: Department) => {
    try {
      // In a real app, make API call to save department
      if (department.id) {
        // Update existing department
        setDepartments(prev => 
          prev.map(d => d.id === department.id ? department : d)
        );
        setIsEditModalOpen(false);
      } else {
        // Add new department
        setDepartments(prev => [...prev, { ...department, id: Date.now().toString() }]);
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department. Please try again.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDepartment) return;

    try {
      // In a real app, make API call to delete department
      setDepartments(prev => prev.filter(d => d.id !== selectedDepartment.id));
      setIsDeleteModalOpen(false);
      setSelectedDepartment(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage departments and their associated providers.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedDepartments.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Selected ({selectedDepartments.length})
            </button>
          )}
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Department
          </button>
        </div>
      </div>

      {/* Bulk selection header */}
      <div className="bg-white shadow rounded-lg p-4 mb-4 flex items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            checked={selectedDepartments.length === departments.length}
            onChange={toggleAllDepartments}
          />
          <span className="ml-2 text-sm text-gray-700">
            {selectedDepartments.length === departments.length
              ? 'Deselect All'
              : 'Select All'}
          </span>
        </label>
        <span className="ml-4 text-sm text-gray-500">
          {selectedDepartments.length} of {departments.length} selected
        </span>
      </div>

      <div className="space-y-4">
        {departments.map((department) => (
          <div
            key={department.id}
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow duration-200 ${
              selectedDepartments.includes(department.id) ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={selectedDepartments.includes(department.id)}
                  onChange={() => toggleDepartmentSelection(department.id)}
                />
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                  <p className="text-sm text-gray-500">{department.location}</p>
                  <div className="mt-2 flex items-center space-x-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <UsersIcon className="h-5 w-5 mr-1 text-gray-400" />
                      {department.providerCount} Providers
                    </div>
                    <div className="text-sm text-gray-500">
                      Director: {department.director}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAssignProviders(department)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <UserPlusIcon className="h-4 w-4 mr-1" />
                  Assign Providers
                </button>
                <button
                  onClick={() => handleEdit(department)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(department)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      <DepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSave}
        mode="add"
      />

      {/* Edit Department Modal */}
      <DepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        department={selectedDepartment}
        mode="edit"
      />

      {/* Delete Confirmation Modal */}
      <DeleteDepartmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        department={selectedDepartment}
      />

      {/* Assign Providers Modal */}
      {selectedDepartment && (
        <AssignProvidersModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleProviderAssignment}
          department={selectedDepartment}
        />
      )}
    </div>
  );
} 