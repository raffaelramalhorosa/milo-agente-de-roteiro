import { useEffect } from 'react'

export default function ErrorToast({ mensagem, onFechar }) {
  useEffect(() => {
    const t = setTimeout(onFechar, 6000)
    return () => clearTimeout(t)
  }, [mensagem])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-fade-slide-up">
      <div className="flex items-start gap-3 bg-zinc-900 border border-rose-900 rounded-lg px-5 py-4">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
        <p className="text-sm text-zinc-300 leading-relaxed flex-1">{mensagem}</p>
        <button
          onClick={onFechar}
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-lg leading-none shrink-0 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
