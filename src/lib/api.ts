import type {
  SavedPrompt,
  CreatePromptRequest,
  ReportResult,
  RunQueryRequest,
} from '@/types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// --- Saved Prompts ---

export function getPrompts(): Promise<SavedPrompt[]> {
  return request('/api/prompts')
}

export function getPrompt(id: string): Promise<SavedPrompt> {
  return request(`/api/prompts/${id}`)
}

export function createPrompt(body: CreatePromptRequest): Promise<SavedPrompt> {
  return request('/api/prompts', { method: 'POST', body: JSON.stringify(body) })
}

export function deletePrompt(id: string): Promise<void> {
  return request(`/api/prompts/${id}`, { method: 'DELETE' })
}

// --- Query / Reports ---

export function runQuery(body: RunQueryRequest): Promise<ReportResult> {
  return request('/api/query/run', { method: 'POST', body: JSON.stringify(body) })
}

export function getReportPage(
  jobId: string,
  page = 1,
  pageSize = 50,
  sort?: string,
  dir?: 'asc' | 'desc',
): Promise<ReportResult> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(sort ? { sort } : {}),
    ...(dir ? { dir } : {}),
  })
  return request(`/api/query/${jobId}?${params}`)
}

export function getExportUrl(jobId: string, format: 'excel' | 'pdf'): string {
  return `/api/query/${jobId}/export?format=${format}`
}
