'use client';  // This must be the first line of the file

import React from 'react';
import AdminNav from './AdminNav';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <div className="flex-1 ml-64">
        <main className="p-6 bg-gray-100 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 