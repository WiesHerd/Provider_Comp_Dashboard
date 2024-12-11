'use client';

import React from 'react';
import AdminNav from '../AdminLayout/AdminNav';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminNav />
      <div className="flex-1 transition-all duration-300 [&:has(+aside.w-16)]:ml-16 ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 