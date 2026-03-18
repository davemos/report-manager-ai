'use client'

import { useRouter } from 'next/navigation'
import PromptInput from '@/components/PromptInput'

export default function NewReportPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">New Report</h1>
      <p className="text-gray-500 text-sm mb-6">
        Describe the data you want to see. The AI will generate a SQL query and build the report.
      </p>
      <PromptInput
        onResult={result => router.push(`/reports/${result.jobId}`)}
      />
    </div>
  )
}
