import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Provider Comp',
    href: '/',
    icon: HomeIcon,
  },
  {
    name: 'Providers',
    href: '/admin/providers',
    icon: UsersIcon,
  },
  {
    name: 'Market Data',
    href: '/admin/market-data',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Upload',
    href: '/admin/upload',
    icon: ArrowUpTrayIcon,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: DocumentChartBarIcon,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Cog6ToothIcon,
  },
]; 