import { HomeIcon, UsersIcon, ArrowUpTrayIcon, ChartBarIcon, Cog6ToothIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#1a1c23]">
      {/* Logo */}
      <Link href="/" className="flex h-14 items-center px-4 mb-4">
        <HomeIcon className="h-5 w-5 text-indigo-500" />
        <span className="ml-2 text-white">Provider Comp</span>
      </Link>

      {/* Essential Navigation */}
      <nav className="flex-1 space-y-0.5 px-2">
        <Link
          href="/admin/providers"
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
            pathname === '/admin/providers' 
              ? 'bg-indigo-500 text-white' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <UsersIcon className="h-5 w-5 mr-2" />
          Providers
        </Link>

        <Link
          href="/admin/market-data"
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
            pathname === '/admin/market-data'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <CurrencyDollarIcon className="h-5 w-5 mr-2" />
          Market Data
        </Link>

        <Link
          href="/admin/upload"
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
            pathname === '/admin/upload'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
          Upload
        </Link>

        <Link
          href="/admin/reports"
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
            pathname === '/admin/reports'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Reports
        </Link>
      </nav>

      {/* Settings at bottom */}
      <div className="px-2 py-4 mt-auto">
        <Link
          href="/admin/settings"
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
            pathname === '/admin/settings'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          Settings
        </Link>
      </div>
    </div>
  );
} 