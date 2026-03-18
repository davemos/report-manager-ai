export interface SavedPrompt {
  id: string
  name: string
  description?: string
  prompt: string
  createdAt: string
}

export interface CreatePromptRequest {
  name: string
  description?: string
  prompt: string
}

export type ColumnType = 'string' | 'number' | 'date' | 'currency' | 'percent'
export type FormatType = 'currency' | 'percent' | 'number' | 'text'

export interface ReportColumn {
  key: string
  label: string
  type: ColumnType
  sortable?: boolean
}

export interface SummaryMetric {
  label: string
  value: number
  format: FormatType
}

export interface ReportResult {
  jobId: string
  title: string
  description: string
  summary: SummaryMetric[]
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
  totalRows: number
  pageSize: number
  page: number
  queryDescription: string
  executionMs: number
}

export interface RunQueryRequest {
  promptId?: string
  customPrompt?: string
}

export interface FirestoreFilter {
  field: string
  op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains'
  value: unknown
}

export interface FirestoreQuerySpec {
  title: string
  description: string
  collection: string
  filters?: FirestoreFilter[]
  limit?: number
  summarySpec?: {
    label: string
    sourceColumn: string
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
    format: FormatType
  }[]
  columns: ReportColumn[]
}
