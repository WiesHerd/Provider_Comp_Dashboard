'use client';

import { 
  ChartBarIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';

const Header = ({ provider }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">
          {provider.firstName} {provider.lastName}, MD
          <span className="text-gray-500 text-lg ml-2">
            - Specialty: {provider.specialty}
          </span>
        </h1>
        <p className="text-gray-600">Provider Compensation Dashboard</p>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          Employee ID: {provider.employeeId}
        </span>
        <span className="text-sm text-gray-600">
          FTE: {provider.fte}
        </span>
      </div>
    </div>
  );
};

export default Header; 