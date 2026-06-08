export default function Historico({ historico, onVerRoteiro }) {
  const itens = [...historico].reverse()

  return (
    <div className="mt-16 pt-8 border-t border-zinc-800">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Histórico</p>

      {itens.length === 0 ? (
        <p className="text-zinc-600 text-sm">Nenhum roteiro gerado ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {itens.map(item => {
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
      )}
    </div>
  )
}
