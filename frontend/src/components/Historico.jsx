import { useState } from 'react'

const POR_PAGINA = 8

export default function Historico({ historico, onVerRoteiro }) {
  const [pagina, setPagina] = useState(0)
  const itens = [...historico].reverse()
  const totalPaginas = Math.ceil(itens.length / POR_PAGINA)
  const pagAtual = itens.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

  return (
    <div className="animate-fade-in">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-5">
        Histórico
        {itens.length > 0 && (
          <span className="ml-2 normal-case text-zinc-700">({itens.length} roteiros)</span>
        )}
      </p>

      {itens.length === 0 ? (
        <p className="text-zinc-600 text-sm">Nenhum roteiro gerado ainda.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {pagAtual.map(item => {
              const motivos = [...(item.motivos || [])]
              if (item.motivo_outro) motivos.push(item.motivo_outro)
              const data = new Date(item.data).toLocaleString('pt-BR')
              const aprovado = item.decisao === 'aprovado'

              return (
                <button
                  key={item.id}
                  onClick={() => onVerRoteiro(item)}
                  className="card px-5 py-4 text-left hover:border-zinc-700
                             hover:bg-zinc-800 transition-colors cursor-pointer w-full"
                >
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <span className="text-sm font-semibold text-zinc-200">{item.tema}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0
                      ${aprovado
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        : 'bg-rose-950 text-rose-400 border border-rose-900'}`}>
                      {aprovado ? '👍 Aprovado' : '👎 Recusado'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600">
                    {motivos.length ? motivos.join(' · ') : 'Sem motivos registrados'}
                  </p>
                  <p className="text-xs text-zinc-700 mt-1">{data}</p>
                  <p className="text-xs text-accent mt-2">Ver roteiro →</p>
                </button>
              )
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-between items-center mt-5 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setPagina(p => p - 1)}
                disabled={pagina === 0}
                className="text-xs px-3 py-2 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700
                           hover:border-zinc-500 hover:text-zinc-200 transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span className="text-xs text-zinc-600">
                {pagina + 1} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(p => p + 1)}
                disabled={pagina === totalPaginas - 1}
                className="text-xs px-3 py-2 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700
                           hover:border-zinc-500 hover:text-zinc-200 transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próximo →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
