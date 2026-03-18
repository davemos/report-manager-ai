import type { SummaryMetric } from '@/types'
import KpiCard from './KpiCard'

interface Props {
  metrics: SummaryMetric[]
}

export default function SummaryPage({ metrics }: Props) {
  if (metrics.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-8 text-center">
        No summary metrics available for this report.
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Key Metrics</h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <KpiCard key={i} metric={metric} />
        ))}
      </div>
    </div>
  )
}
