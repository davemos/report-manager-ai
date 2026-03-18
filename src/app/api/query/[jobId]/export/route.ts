import { NextResponse } from 'next/server'
import { getReport } from '@/lib/report-cache'
import { exportToExcel, exportToPdf } from '@/lib/export'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params
    const cached = getReport(jobId)
    if (!cached) return NextResponse.json({ error: 'Report not found or expired' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') === 'pdf' ? 'pdf' : 'excel'

    const safeName = cached.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
    const date = new Date().toISOString().slice(0, 10)

    const exportData = {
      title: cached.title,
      description: cached.description,
      columns: cached.columns,
      summary: cached.summary,
      allRows: cached.allRows,
    }

    if (format === 'pdf') {
      const buf = await exportToPdf(exportData)
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}_${date}.pdf"`,
        },
      })
    } else {
      const buf = await exportToExcel(exportData)
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${safeName}_${date}.xlsx"`,
        },
      })
    }
  } catch (e) {
    console.error('export error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
