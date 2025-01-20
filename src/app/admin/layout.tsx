'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/common/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onCollapse={setIsCollapsed} 
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'pl-16' : 'pl-64'}`}>
        <main className="py-6 px-8">
          {children}
        </main>
      </div>
    </div>
  );
} 