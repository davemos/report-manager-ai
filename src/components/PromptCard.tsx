import type { SavedPrompt } from '@/types'

interface Props {
  prompt: SavedPrompt
  running: boolean
  onRun: (prompt: SavedPrompt) => void
  onDelete: (id: string) => void
}

export default function PromptCard({ prompt, running, onRun, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">{prompt.name}</h3>
        {prompt.description && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{prompt.description}</p>
        )}
      </div>
      <p className="text-xs text-gray-400 line-clamp-3 font-mono bg-gray-50 rounded p-2 border border-gray-100">
        {prompt.prompt}
      </p>
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onRun(prompt)}
          disabled={running}
          className="flex-1 bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50"
        >
          {running ? 'Running...' : 'Run Report'}
        </button>
        <button
          onClick={() => onDelete(prompt.id)}
          className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
