import { NextResponse } from 'next/server'
import { getReport } from '@/lib/report-cache'
import type { ReportResult } from '@/types'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params
    const cached = getReport(jobId)
    if (!cached) return NextResponse.json({ error: 'Report not found or expired' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') ?? '50')))
    const sort = searchParams.get('sort') ?? ''
    const dir = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    let rows = [...cached.allRows]
    if (sort) {
      rows.sort((a, b) => {
        const av = a[sort] ?? ''
        const bv = b[sort] ?? ''
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return dir === 'desc' ? -cmp : cmp
      })
    }

    const result: ReportResult = {
      jobId,
      title: cached.title,
      description: cached.description,
      summary: cached.summary,
      columns: cached.columns,
      rows: rows.slice((page - 1) * pageSize, page * pageSize),
      totalRows: rows.length,
      pageSize,
      page,
      queryDescription: cached.queryDescription,
      executionMs: cached.executionMs,
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
