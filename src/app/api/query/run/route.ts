import { NextResponse } from 'next/server'
import { getPromptById, getSchemaContext, executeQuery } from '@/lib/firestore-service'
import { generateQuerySpec } from '@/lib/ai-agent'
import { storeReport } from '@/lib/report-cache'
import type { RunQueryRequest, SummaryMetric, ReportResult } from '@/types'

export async function POST(req: Request) {
  try {
    const body = await req.json() as RunQueryRequest

    let promptText: string
    if (body.promptId) {
      const saved = await getPromptById(body.promptId)
      if (!saved) return NextResponse.json({ error: 'Saved prompt not found' }, { status: 404 })
      promptText = saved.prompt
    } else if (body.customPrompt?.trim()) {
      promptText = body.customPrompt
    } else {
      return NextResponse.json({ error: 'Provide promptId or customPrompt' }, { status: 400 })
    }

    const start = Date.now()
    const schemaContext = await getSchemaContext()
    const spec = await generateQuerySpec(promptText, schemaContext)
    const allRows = await executeQuery(spec)
    const executionMs = Date.now() - start

    const summary = computeSummary(spec.summarySpec ?? [], allRows)
    const jobId = crypto.randomUUID()

    storeReport(jobId, {
      jobId,
      title: spec.title,
      description: spec.description,
      summary,
      columns: spec.columns,
      allRows,
      queryDescription: `Collection: ${spec.collection}, Filters: ${JSON.stringify(spec.filters ?? [])}`,
      executionMs,
    })

    const result: ReportResult = {
      jobId,
      title: spec.title,
      description: spec.description,
      summary,
      columns: spec.columns,
      rows: allRows.slice(0, 50),
      totalRows: allRows.length,
      pageSize: 50,
      page: 1,
      queryDescription: `Collection: ${spec.collection}, Filters: ${JSON.stringify(spec.filters ?? [])}`,
      executionMs,
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('query/run error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

function computeSummary(
  specs: { label: string; sourceColumn: string; aggregation: string; format: string }[],
  rows: Record<string, unknown>[],
): SummaryMetric[] {
  return specs.map(spec => {
    const vals = rows.map(r => toNumber(r[spec.sourceColumn]))
    let value = 0
    switch (spec.aggregation) {
      case 'count': value = rows.length; break
      case 'sum':   value = vals.reduce((a, b) => a + b, 0); break
      case 'avg':   value = rows.length ? vals.reduce((a, b) => a + b, 0) / rows.length : 0; break
      case 'min':   value = rows.length ? Math.min(...vals) : 0; break
      case 'max':   value = rows.length ? Math.max(...vals) : 0; break
    }
    return { label: spec.label, value, format: spec.format as SummaryMetric['format'] }
  })
}

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val
  const n = parseFloat(String(val))
  return isNaN(n) ? 0 : n
}
