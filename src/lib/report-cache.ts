import type { SummaryMetric, ReportColumn } from '@/types'

export interface CachedReport {
  jobId: string
  title: string
  description: string
  summary: SummaryMetric[]
  columns: ReportColumn[]
  allRows: Record<string, unknown>[]
  queryDescription: string
  executionMs: number
  expiresAt: number
}

const cache = new Map<string, CachedReport>()
const TTL_MS = 60 * 60 * 1000 // 60 minutes

export function storeReport(jobId: string, report: Omit<CachedReport, 'expiresAt'>): void {
  cache.set(jobId, { ...report, expiresAt: Date.now() + TTL_MS })
  // Clean up expired entries
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < Date.now()) cache.delete(key)
  }
}

export function getReport(jobId: string): CachedReport | null {
  const entry = cache.get(jobId)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    cache.delete(jobId)
    return null
  }
  return entry
}
