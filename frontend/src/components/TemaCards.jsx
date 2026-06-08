import { useState } from 'react'

export default function TemaCards({ temas, onEscolher }) {
  const [votos, setVotos] = useState({})

  async function votar(tema, i, voto, e) {
    e.stopPropagation()
    setVotos(prev => ({ ...prev, [i]: voto }))
    await fetch('/votar-tema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: tema.titulo, resumo: tema.resumo, voto }),
    }).catch(() => {})
  }

  return (
    <div className="animate-fade-in">
      <p className="text-zinc-500 text-sm mb-4 tracking-wide uppercase">
        Escolha um tema
      </p>
      <div className="flex flex-col gap-2">
        {temas.map((tema, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 90}ms` }}
            className="card px-5 py-4 hover:border-accent hover:bg-zinc-800
                       transition-colors animate-fade-slide-up"
          >
            <button
              onClick={() => onEscolher(tema)}
              className="text-left w-full group"
            >
              <p className="text-base font-semibold text-zinc-100 mb-1
                            group-hover:text-accent transition-colors">
                {tema.titulo}
              </p>
              <p className="text-sm text-zinc-500">{tema.resumo}</p>
            </button>

            <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-zinc-800">
              <button
                onClick={e => votar(tema, i, 'bom', e)}
                title="Bom tema"
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors
                  ${votos[i] === 'bom'
                    ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-emerald-800 hover:text-emerald-500'}`}
              >
                👍
              </button>
              <button
                onClick={e => votar(tema, i, 'ruim', e)}
                title="Tema ruim"
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors
                  ${votos[i] === 'ruim'
                    ? 'bg-rose-900/40 border-rose-700 text-rose-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-rose-800 hover:text-rose-500'}`}
              >
                👎
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
