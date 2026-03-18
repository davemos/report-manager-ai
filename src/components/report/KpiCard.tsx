import type { SummaryMetric } from '@/types'

interface Props {
  metric: SummaryMetric
}

function formatValue(value: number, format: SummaryMetric['format']): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
    case 'percent':
      return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(value / 100)
    case 'number':
      return new Intl.NumberFormat('en-US').format(value)
    default:
      return String(value)
  }
}

export default function KpiCard({ metric }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{metric.label}</p>
      <p className="text-3xl font-bold text-gray-900 tabular-nums">
        {formatValue(metric.value, metric.format)}
      </p>
    </div>
  )
}
