'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getReportPage } from '@/lib/api'
import type { ReportResult } from '@/types'
import SummaryPage from '@/components/report/SummaryPage'
import ReportNav from '@/components/ReportNav'

function formatCell(value: unknown, type: string): string {
  if (value === null || value === undefined) return ''
  switch (type) {
    case 'currency':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
        : String(value)
    case 'percent':
      return typeof value === 'number' ? `${value.toFixed(2)}%` : String(value)
    case 'date':
      return String(value).split('T')[0]
    default:
      return String(value)
  }
}

export default function ReportSummaryPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [report, setReport] = useState<ReportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return
    getReportPage(jobId, 1)
      .then(setReport)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load report'))
  }, [jobId])

  if (error) return (
    <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
  )
  if (!report) return <div className="text-gray-400 text-sm">Loading report...</div>

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
        {report.description && (
          <p className="text-gray-500 text-sm mt-1">{report.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {report.totalRows.toLocaleString()} rows · {report.executionMs}ms
        </p>
      </div>

      <ReportNav jobId={jobId} />

      <SummaryPage metrics={report.summary} />

      {report.rows.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Results {report.totalRows > report.rows.length ? `(first ${report.rows.length} of ${report.totalRows.toLocaleString()})` : `(${report.totalRows.toLocaleString()})`}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-blue-900 text-white">
                <tr>
                  {report.columns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {report.columns.map(col => (
                      <td key={col.key} className="px-4 py-2.5 border-b border-gray-100 whitespace-nowrap">
                        {formatCell(row[col.key], col.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
