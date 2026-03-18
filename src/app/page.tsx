'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getPrompts, deletePrompt, runQuery } from '@/lib/api'
import type { SavedPrompt } from '@/types'
import PromptCard from '@/components/PromptCard'

export default function HomePage() {
  const router = useRouter()
  const [prompts, setPrompts] = useState<SavedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPrompts()
      .then(setPrompts)
      .catch(() => setError('Failed to load saved reports.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleRun(prompt: SavedPrompt) {
    setRunning(prompt.id)
    setError(null)
    try {
      const result = await runQuery({ promptId: prompt.id })
      router.push(`/reports/${result.jobId}`)
    } catch (e) {
      setError(`Failed to run report: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setRunning(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved report?')) return
    await deletePrompt(id)
    setPrompts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Reports</h1>
        <Link
          href="/reports/new"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          + New Report
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No saved reports yet.</p>
          <Link href="/reports/new" className="text-blue-600 hover:underline text-sm">
            Create your first report →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map(p => (
            <PromptCard
              key={p.id}
              prompt={p}
              running={running === p.id}
              onRun={handleRun}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
