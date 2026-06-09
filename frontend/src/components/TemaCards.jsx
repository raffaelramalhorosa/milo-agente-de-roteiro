import { useState } from 'react'

const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY || 'pk_QClW5s7wSE6eSanBu7b42A'

function normalizarDominio(valor) {
  if (!valor) return ''
  return String(valor)
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .split('?')[0]
}

function LogoEmpresa({ tema }) {
  const [falhou, setFalhou] = useState(false)
  const dominio = normalizarDominio(tema.dominio)
  const inicial = (tema.titulo || '?').trim().charAt(0).toUpperCase()

  if (!dominio || falhou) {
    return (
      <div className="shrink-0 h-11 w-11 rounded-lg border border-zinc-700 bg-zinc-800
                      flex items-center justify-center text-sm font-bold text-zinc-400">
        {inicial}
      </div>
    )
  }

  const src = `https://img.logo.dev/${encodeURIComponent(dominio)}?token=${LOGO_DEV_TOKEN}&format=webp`

  return (
    <div className="shrink-0 h-11 w-11 rounded-lg border border-zinc-700 bg-zinc-900
                    flex items-center justify-center overflow-hidden">
      <img
        src={src}
        alt={`Logo ${tema.titulo}`}
        className="h-8 w-8 object-contain"
        loading="lazy"
        referrerPolicy="origin"
        onError={() => setFalhou(true)}
      />
    </div>
  )
}

function classeStatus(status) {
  if (status === 'confiavel') return 'border-emerald-900/70 bg-emerald-950/20 text-emerald-300'
  if (status === 'atencao') return 'border-amber-900/70 bg-amber-950/20 text-amber-300'
  return 'border-zinc-800 bg-zinc-900/70 text-zinc-300'
}

function rotuloStatus(status) {
  if (status === 'confiavel') return 'Confiavel'
  if (status === 'atencao') return 'Atencao'
  return 'Incerto'
}

function PainelChecagem({ resultado }) {
  return (
    <div className={`mt-3 rounded-lg border p-3 ${classeStatus(resultado.status)}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide">{rotuloStatus(resultado.status)}</p>
        {resultado.fontes?.length > 0 && (
          <p className="text-[11px] text-zinc-500">{resultado.fontes.length} fontes</p>
        )}
      </div>

      {resultado.resumo && (
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{resultado.resumo}</p>
      )}

      {resultado.pontos?.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {resultado.pontos.slice(0, 4).map((ponto, i) => (
            <div key={i} className="border-t border-zinc-800/80 pt-2">
              <p className="text-xs font-semibold text-zinc-400">{ponto.afirmacao}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                <span className="font-semibold text-zinc-400">{ponto.veredito}</span>
                {ponto.detalhe ? ` - ${ponto.detalhe}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {resultado.versao_segura && (
        <div className="mt-3 border-t border-zinc-800/80 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Versao segura</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{resultado.versao_segura}</p>
        </div>
      )}

      {resultado.fontes?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {resultado.fontes.slice(0, 4).map((fonte, i) => (
            <a
              key={i}
              href={fonte.url}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[11px] text-accent hover:text-blue-300 truncate max-w-full"
            >
              {fonte.titulo || fonte.url}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TemaCards({ temas, editoria, checagens, onChecagem, onEscolher, onBuscarNovos, onSalvar, onDescartar }) {
  const [ocultos, setOcultos] = useState(new Set())

  async function votar(tema, i, voto, e) {
    e.stopPropagation()
    setOcultos(prev => new Set([...prev, i]))

    await fetch('/votar-sugestao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: tema.titulo, resumo: tema.resumo, dominio: tema.dominio, voto }),
    }).catch(() => {})

    if (voto === 'salvar') onSalvar?.(tema)
    if (voto === 'descartar') onDescartar?.(tema)
  }

  async function checarFatos(tema, i, e) {
    e.stopPropagation()
    onChecagem(prev => ({ ...prev, [i]: { carregando: true } }))

    const payload = {
      titulo: tema.titulo,
      resumo: tema.resumo,
      sacada: tema.sacada,
      numeros: tema.numeros,
      dominio: tema.dominio,
      editoria,
    }
    console.log('[checarFatos] payload enviado:', payload)

    try {
      const resp = await fetch('/checar-fatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('[checarFatos] status HTTP:', resp.status)

      const dados = await resp.json()
      console.log('[checarFatos] resposta do servidor:', dados)

      if (!resp.ok) {
        console.warn('[checarFatos] resposta não-ok, erro:', dados.erro)
        onChecagem(prev => ({
          ...prev,
          [i]: { erro: dados.erro || 'Nao foi possivel checar este tema.' },
        }))
        return
      }
      onChecagem(prev => ({ ...prev, [i]: { resultado: dados } }))
    } catch (err) {
      console.error('[checarFatos] exceção na requisição:', err)
      onChecagem(prev => ({
        ...prev,
        [i]: { erro: 'Servidor indisponivel para checar fatos.' },
      }))
    }
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
          const checagem = checagens[i]
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
                <div className="flex items-start gap-3 mb-2">
                  <LogoEmpresa tema={tema} />
                  <div className="min-w-0 pt-0.5">
                    <p className="text-base font-semibold text-zinc-100
                                  group-hover:text-accent transition-colors">
                      {tema.titulo}
                    </p>
                    {tema.dominio && (
                      <p className="text-xs text-zinc-600 mt-0.5 truncate">
                        {normalizarDominio(tema.dominio)}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{tema.resumo}</p>
                {tema.sacada && (
                  <p className="text-xs text-amber-500/80 mt-2 leading-relaxed">
                    ⚡ {tema.sacada}
                  </p>
                )}
                {tema.numeros && (
                  <p className="text-xs text-zinc-500 mt-1.5 font-mono">{tema.numeros}</p>
                )}
              </button>

              {checagem?.resultado && <PainelChecagem resultado={checagem.resultado} />}
              {checagem?.erro && (
                <p className="mt-3 rounded-lg border border-rose-900/70 bg-rose-950/20 p-3
                              text-xs text-rose-300">
                  {checagem.erro}
                </p>
              )}

              <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={e => { e.stopPropagation(); onEscolher(tema) }}
                  title="Gerar roteiro"
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors
                             bg-accent/10 border-accent/40 text-accent
                             hover:bg-accent/20 hover:border-accent"
                >
                  Gerar roteiro
                </button>
                <button
                  onClick={e => checarFatos(tema, i, e)}
                  disabled={checagem?.carregando}
                  title="Checar fatos"
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors
                             bg-zinc-800 border-zinc-700 text-zinc-400
                             hover:border-blue-800 hover:text-blue-400
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {checagem?.carregando ? 'Checando...' : 'Checar fatos'}
                </button>
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
