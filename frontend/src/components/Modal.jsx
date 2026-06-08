import { useEffect } from 'react'

export default function Modal({ item, onFechar }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onFechar() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [onFechar])

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-50 animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-7
                      max-w-xl w-full max-h-[85vh] overflow-y-auto relative
                      animate-scale-in">
        <button
          onClick={onFechar}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300
                     transition-colors text-xl leading-none"
        >
          ✕
        </button>
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Roteiro</p>
        <p className="text-base font-bold text-zinc-100 mb-5 pr-8">{item.tema}</p>
        <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300 font-mono">
          {item.roteiro}
        </p>
      </div>
    </div>
  )
}
