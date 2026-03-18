'use client'

import { useState } from 'react'
import { runQuery, createPrompt } from '@/lib/api'
import type { ReportResult } from '@/types'

interface Props {
  onResult: (result: ReportResult) => void
}

export default function PromptInput({ onResult }: Props) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveAs, setSaveAs] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleRun() {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await runQuery({ customPrompt: prompt })
      onResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run report')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!saveAs.trim() || !prompt.trim()) return
    setSaving(true)
    try {
      await createPrompt({ name: saveAs, prompt })
      setSaved(true)
    } catch {
      setError('Failed to save prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="w-full h-36 rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Describe the report you want to generate…&#10;&#10;e.g. Show me total sales by region for the last 30 days, sorted highest to lowest."
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
      )}

      <div className="flex gap-3 items-center">
        <button
          onClick={handleRun}
          disabled={loading || !prompt.trim()}
          className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Run Report'}
        </button>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500 mb-2">Save this prompt for reuse:</p>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Report name…"
            value={saveAs}
            onChange={e => setSaveAs(e.target.value)}
          />
          <button
            onClick={handleSave}
            disabled={saving || !saveAs.trim() || !prompt.trim() || saved}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
