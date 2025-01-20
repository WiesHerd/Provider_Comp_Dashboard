import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Clarity360 | Provider Compensation Analytics',
  description: 'A comprehensive provider compensation analytics platform offering 360° visibility into compensation data, market benchmarks, and performance metrics.',
  icons: {
    icon: '/images/icon.svg'
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/icon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
        <Toaster />
      </body>
    </html>
  )
} 