import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import type { ReportColumn, SummaryMetric } from '@/types'

interface ExportData {
  title: string
  description: string
  columns: ReportColumn[]
  summary: SummaryMetric[]
  allRows: Record<string, unknown>[]
}

function formatCell(value: unknown, type: ReportColumn['type']): string {
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

export async function exportToExcel(data: ExportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(data.title.slice(0, 31))

  // Header row
  ws.addRow(data.columns.map(c => c.label))
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } }
  headerRow.commit()

  // Data rows
  for (const row of data.allRows) {
    ws.addRow(data.columns.map(col => {
      const val = row[col.key]
      if (col.type === 'number' || col.type === 'currency' || col.type === 'percent') {
        return typeof val === 'number' ? val : parseFloat(String(val)) || 0
      }
      return formatCell(val, col.type)
    }))
  }

  ws.columns.forEach(col => { col.width = 18 })
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export async function exportToPdf(data: ExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28 })
    const chunks: Buffer[] = []
    doc.on('data', chunk => chunks.push(Buffer.from(chunk)))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - 56
    const colWidth = Math.floor(pageWidth / data.columns.length)
    const rowHeight = 18
    const headerHeight = 24

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text(data.title, 28, 28)
    if (data.description) {
      doc.fontSize(9).font('Helvetica').text(data.description, 28, 46)
    }

    let y = data.description ? 64 : 50

    const drawTable = () => {
      // Header
      doc.rect(28, y, pageWidth, headerHeight).fill('#1e40af')
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
      data.columns.forEach((col, i) => {
        doc.text(col.label, 30 + i * colWidth, y + 6, { width: colWidth - 4, ellipsis: true })
      })
      doc.fillColor('black')
      y += headerHeight

      // Rows
      data.allRows.forEach((row, ri) => {
        if (y + rowHeight > doc.page.height - 40) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 28 })
          y = 28
          drawTable()
          return
        }
        if (ri % 2 === 1) doc.rect(28, y, pageWidth, rowHeight).fill('#f9fafb')
        doc.fillColor('black').fontSize(8).font('Helvetica')
        data.columns.forEach((col, i) => {
          doc.text(formatCell(row[col.key], col.type), 30 + i * colWidth, y + 4, {
            width: colWidth - 4, ellipsis: true,
          })
        })
        y += rowHeight
      })
    }

    drawTable()

    // Footer
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      doc.fontSize(7).font('Helvetica').fillColor('#9ca3af')
        .text(`Generated ${new Date().toUTCString()}`, 28, doc.page.height - 20, { width: pageWidth / 2 })
        .text(`Page ${i - range.start + 1} of ${range.count}`, 28, doc.page.height - 20, {
          width: pageWidth, align: 'right',
        })
    }

    doc.end()
  })
}
