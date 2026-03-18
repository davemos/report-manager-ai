import { getExportUrl } from '@/lib/api'

interface Props {
  jobId: string
}

export default function ReportNav({ jobId }: Props) {
  return (
    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
      <div className="ml-auto flex gap-2">
        <a
          href={getExportUrl(jobId, 'excel')}
          download
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          ↓ Excel
        </a>
        <a
          href={getExportUrl(jobId, 'pdf')}
          download
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          ↓ PDF
        </a>
      </div>
    </div>
  )
}
