export default function BuscasRealizadas({ sugestoes, onEscolher }) {
  if (sugestoes.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-zinc-800">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-5">
        Buscas realizadas
        <span className="ml-2 normal-case text-zinc-700">({sugestoes.length})</span>
      </p>

      <div className="flex flex-col gap-2">
        {sugestoes.map((item, i) => (
          <button
            key={i}
            onClick={() => onEscolher(item)}
            className="card px-5 py-4 text-left hover:border-accent hover:bg-zinc-800
                       transition-colors cursor-pointer w-full group"
          >
            <p className="text-sm font-semibold text-zinc-200 mb-1
                          group-hover:text-accent transition-colors">
              {item.titulo}
            </p>
            <p className="text-xs text-zinc-500">{item.resumo}</p>
            <p className="text-xs text-accent mt-2">Gerar roteiro →</p>
          </button>
        ))}
      </div>
    </div>
  )
}
