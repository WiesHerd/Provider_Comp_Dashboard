'use client';

import React, { useState } from 'react';
import AdminNav from '../AdminLayout/AdminNav';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminNav
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <main className="h-screen p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
