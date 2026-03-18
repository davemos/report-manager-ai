import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Report Manager',
  description: 'AI-powered SQL report builder',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased bg-gray-50 min-h-screen`}>
        <header className="bg-blue-900 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg tracking-tight hover:text-blue-200">
              Report Manager
            </Link>
            <nav className="flex gap-4 text-sm text-blue-200">
              <Link href="/" className="hover:text-white">Saved Reports</Link>
              <Link href="/reports/new" className="hover:text-white">New Report</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
