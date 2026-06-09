import { useState } from 'react'

export default function TemaCards({ temas, onEscolher, onBuscarNovos, onSalvar, onDescartar }) {
  const [ocultos, setOcultos] = useState(new Set())

  async function votar(tema, i, voto, e) {
    e.stopPropagation()
    setOcultos(prev => new Set([...prev, i]))

    await fetch('/votar-sugestao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: tema.titulo, resumo: tema.resumo, voto }),
    }).catch(() => {})

    if (voto === 'salvar') onSalvar?.(tema)
    if (voto === 'descartar') onDescartar?.(tema)
  }

  const visiveis = temas.filter((_, i) => !ocultos.has(i))

  if (visiveis.length === 0) {
    return (
      <div className="animate-fade-in">
        <p className="text-zinc-500 text-sm mb-4">Nenhuma sugestão disponível.</p>
        <button
          onClick={onBuscarNovos}
          className="btn-primary"
        >
          Buscar novos temas
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <p className="text-zinc-500 text-sm mb-4 tracking-wide uppercase">
        Escolha um tema
      </p>
      <div className="flex flex-col gap-2">
        {temas.map((tema, i) => {
          if (ocultos.has(i)) return null
          return (
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
                  onClick={e => votar(tema, i, 'salvar', e)}
                  title="Salvar para depois"
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors
                             bg-zinc-800 border-zinc-700 text-zinc-500
                             hover:border-emerald-800 hover:text-emerald-500"
                >
                  👍
                </button>
                <button
                  onClick={e => votar(tema, i, 'descartar', e)}
                  title="Descartar sugestão"
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors
                             bg-zinc-800 border-zinc-700 text-zinc-500
                             hover:border-rose-800 hover:text-rose-500"
                >
                  👎
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onBuscarNovos}
        className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors w-full text-center py-2"
      >
        ↻ Buscar novos temas
      </button>
    </div>
  )
}
