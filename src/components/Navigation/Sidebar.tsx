'use client';

import React, { useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  CalendarIcon,
  FolderIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

// Create context for sidebar state
const SidebarContext = createContext({ expanded: true });

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  alert?: boolean;
}

// SidebarItem component
function SidebarItem({ icon, text, active, alert }: SidebarItemProps) {
  const { expanded } = useContext(SidebarContext);
  
  return (
    <li className={`
      relative flex items-center py-2 px-3 my-1
      font-medium rounded-md cursor-pointer
      transition-colors group
      ${active ? "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800" : "hover:bg-gray-700 text-gray-300"}
    `}>
      {icon}
      <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}>
        {text}
      </span>
      {alert && (
        <div className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${expanded ? "" : "top-2"}`} />
      )}

      {!expanded && (
        <div className={`
          absolute left-full rounded-md px-2 py-1 ml-6
          bg-gray-700 text-gray-300 text-sm
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
        `}>
          {text}
        </div>
      )}
    </li>
  );
}

const Sidebar = () => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <aside className="h-screen">
      <nav className="h-full flex flex-col bg-gray-800 border-r shadow-sm">
        <div className="p-4 pb-2 flex justify-between items-center">
          <h1 className={`overflow-hidden transition-all text-white font-bold ${expanded ? "w-32" : "w-0"}`}>
            wRVU Admin
          </h1>
          <button
            onClick={() => setExpanded(curr => !curr)}
            className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
          >
            {expanded ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
          </button>
        </div>

        {expanded && (
          <div className="p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search providers..."
                className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        )}

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3">
            <SidebarItem icon={<HomeIcon className="w-6 h-6" />} text="Dashboard" active />
            <SidebarItem icon={<CalendarIcon className="w-6 h-6" />} text="Calendar" alert />
            <SidebarItem icon={<FolderIcon className="w-6 h-6" />} text="Providers" />
            <SidebarItem icon={<ChartBarIcon className="w-6 h-6" />} text="Reports" />
            <SidebarItem icon={<Cog6ToothIcon className="w-6 h-6" />} text="Settings" />
          </ul>
        </SidebarContext.Provider>
      </nav>
    </aside>
  );
};

export default Sidebar;