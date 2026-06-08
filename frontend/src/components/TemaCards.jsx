export default function TemaCards({ temas, onEscolher }) {
  return (
    <div className="animate-fade-in">
      <p className="text-zinc-500 text-sm mb-4 tracking-wide uppercase">
        Escolha um tema
      </p>
      <div className="flex flex-col gap-2">
        {temas.map((tema, i) => (
          <button
            key={i}
            onClick={() => onEscolher(tema)}
            style={{ animationDelay: `${i * 90}ms` }}
            className="card px-5 py-4 text-left hover:border-accent
                       hover:bg-zinc-800 transition-colors cursor-pointer w-full group
                       animate-fade-slide-up"
          >
            <p className="text-base font-semibold text-zinc-100 mb-1 group-hover:text-accent transition-colors">
              {tema.titulo}
            </p>
            <p className="text-sm text-zinc-500">{tema.resumo}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
