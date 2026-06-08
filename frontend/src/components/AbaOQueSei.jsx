import { useState, useEffect } from 'react'

// ─── Padrões aprendidos ────────────────────────────────────────────────────────

function calcularPadroes(historico) {
  const aprovados = historico.filter(e => e.decisao === 'aprovado')
  const recusados = historico.filter(e => e.decisao === 'recusado')

  function topMotivos(items) {
    const counts = {}
    items.forEach(item =>
      (item.motivos || []).forEach(m => { counts[m] = (counts[m] || 0) + 1 })
    )
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }

  return {
    totalAprovados:    aprovados.length,
    totalRecusados:    recusados.length,
    motivosPositivos:  topMotivos(aprovados),
    motivosNegativos:  topMotivos(recusados),
    ultimosAprovados:  aprovados.slice(-3).reverse().map(e => e.tema),
    ultimosRecusados:  recusados.slice(-3).reverse().map(e => e.tema),
  }
}

// ─── Seção editável de configuração ───────────────────────────────────────────

function SecaoEditavel({ titulo, fonte, conteudo, onSalvar }) {
  const [editando, setEditando]   = useState(false)
  const [rascunho, setRascunho]   = useState(conteudo)
  const [salvo, setSalvo]         = useState(false)

  useEffect(() => { setRascunho(conteudo) }, [conteudo])

  async function salvar() {
    await onSalvar(rascunho)
    setSalvo(true)
    setEditando(false)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{titulo}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border
            ${fonte === 'personalizado'
              ? 'bg-accent-dim text-accent border-accent/30'
              : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
            {fonte === 'personalizado' ? '🟢 Personalizado' : '⚪ Padrão do servidor'}
          </span>
          {salvo && (
            <span className="text-[10px] text-emerald-400">✓ Salvo</span>
          )}
        </div>
      </div>

      {editando ? (
        <>
          <textarea
            value={rascunho}
            onChange={e => setRascunho(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 rounded-md border border-accent bg-zinc-950
                       text-sm text-zinc-300 font-mono leading-relaxed resize-y
                       focus:outline-none transition-colors"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={salvar}
              className="text-xs px-3 py-2 rounded-md bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
              style={{ backgroundColor: '#4f8ef7' }}
            >
              Salvar
            </button>
            <button
              onClick={() => { setRascunho(conteudo); setEditando(false) }}
              className="text-xs px-3 py-2 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <pre className="text-xs text-zinc-500 font-mono leading-relaxed bg-zinc-950
                          border border-zinc-800 rounded-md p-4 max-h-32 overflow-y-auto
                          whitespace-pre-wrap">
            {conteudo || '(vazio)'}
          </pre>
          <button
            onClick={() => setEditando(true)}
            className="mt-2 text-xs px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400
                       border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            Editar
          </button>
        </>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function AbaOQueSei({ contexto, onAtualizar, historico }) {
  const [servidorCtx, setServidorCtx]       = useState(null)
  const [historiasRascunho, setHistorias]   = useState('')
  const [editandoHistorias, setEditHist]    = useState(false)
  const [salvandoHistorias, setSalvando]    = useState(false)
  const [salvoHistorias, setSalvoHistorias] = useState(false)

  useEffect(() => {
    fetch('/contexto-agente')
      .then(r => r.json())
      .then(dados => {
        setServidorCtx(dados)
        setHistorias(dados.historias_coletadas)
      })
  }, [])

  // Para cada área, o conteúdo ativo é localStorage se preenchido, senão o arquivo do servidor
  function conteudoAtivo(chave, chaveServidor) {
    return contexto[chave] || servidorCtx?.[chaveServidor] || ''
  }

  function fonteAtiva(chave) {
    return contexto[chave] ? 'personalizado' : 'servidor'
  }

  // Salvar configurações: se localStorage tem override, atualiza localStorage
  // Se estava usando padrão do servidor, cria um override no localStorage
  function salvarConfig(chave, valor) {
    onAtualizar(chave, valor)
    return Promise.resolve()
  }

  async function salvarHistorias() {
    setSalvando(true)
    await fetch('/contexto-agente/historias', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo: historiasRascunho }),
    })
    setSalvando(false)
    setSalvoHistorias(true)
    setEditHist(false)
    setServidorCtx(prev => ({ ...prev, historias_coletadas: historiasRascunho }))
    setTimeout(() => setSalvoHistorias(false), 2000)
  }

  async function limparHistorias() {
    const vazio = '# Histórias já usadas\n(ainda nenhuma)'
    setHistorias(vazio)
    await fetch('/contexto-agente/historias', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo: vazio }),
    })
    setServidorCtx(prev => ({ ...prev, historias_coletadas: vazio }))
  }

  const padroes = calcularPadroes(historico)

  const AREAS = [
    { chave: 'temas',   chaveServidor: 'tipos_de_conteudo', titulo: 'Temas que busco' },
    { chave: 'roteiro', chaveServidor: 'estilo_de_fala',    titulo: 'Como estruturo roteiros' },
    { chave: 'jargoes', chaveServidor: 'estilo_de_fala',    titulo: 'Como falo' },
  ]

  // Corrijo o mapeamento: roteiro usa estrutura_roteiro que não existe no servidor,
  // então para roteiro o servidor fallback é vazio
  const MAPA_SERVIDOR = {
    temas:   'tipos_de_conteudo',
    roteiro: null,          // sem arquivo padrão no servidor para estrutura
    jargoes: 'estilo_de_fala',
  }

  if (!servidorCtx) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">

      {/* ── Configuração ativa ── */}
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 mb-4">
          Configuração ativa
        </p>

        <SecaoEditavel
          titulo="Temas que busco"
          fonte={fonteAtiva('temas')}
          conteudo={conteudoAtivo('temas', 'tipos_de_conteudo')}
          onSalvar={v => salvarConfig('temas', v)}
        />
        <SecaoEditavel
          titulo="Estrutura do roteiro"
          fonte={fonteAtiva('roteiro')}
          conteudo={conteudoAtivo('roteiro', null) || '(usando estrutura padrão do agente)'}
          onSalvar={v => salvarConfig('roteiro', v)}
        />
        <SecaoEditavel
          titulo="Como falo"
          fonte={fonteAtiva('jargoes')}
          conteudo={conteudoAtivo('jargoes', 'estilo_de_fala')}
          onSalvar={v => salvarConfig('jargoes', v)}
        />
      </div>

      {/* ── Memória de temas ── */}
      <div className="mb-8 pt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-widest text-zinc-600">
            Memória de temas usados
          </p>
          <div className="flex gap-2 items-center">
            {salvoHistorias && <span className="text-[10px] text-emerald-400">✓ Salvo</span>}
            <button
              onClick={limparHistorias}
              className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-500
                         border border-zinc-700 hover:border-rose-800 hover:text-rose-400 transition-colors"
            >
              Limpar memória
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mb-3">
          Temas que o agente já abordou. Ele lê essa lista para não repetir assuntos.
        </p>

        {editandoHistorias ? (
          <>
            <textarea
              value={historiasRascunho}
              onChange={e => setHistorias(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-md border border-accent bg-zinc-950
                         text-sm text-zinc-300 font-mono leading-relaxed resize-y
                         focus:outline-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={salvarHistorias}
                disabled={salvandoHistorias}
                className="text-xs px-3 py-2 rounded-md text-white font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#4f8ef7' }}
              >
                {salvandoHistorias ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => { setHistorias(servidorCtx.historias_coletadas); setEditHist(false) }}
                className="text-xs px-3 py-2 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <pre className="text-xs text-zinc-500 font-mono leading-relaxed bg-zinc-950
                            border border-zinc-800 rounded-md p-4 max-h-40 overflow-y-auto
                            whitespace-pre-wrap">
              {servidorCtx.historias_coletadas || '(vazio)'}
            </pre>
            <button
              onClick={() => setEditHist(true)}
              className="mt-2 text-xs px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400
                         border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Editar
            </button>
          </>
        )}
      </div>

      {/* ── Padrões aprendidos ── */}
      <div className="pt-6 border-t border-zinc-800">
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 mb-4">
          Padrões aprendidos
        </p>

        {padroes.totalAprovados === 0 && padroes.totalRecusados === 0 ? (
          <p className="text-xs text-zinc-600">
            Nenhum feedback registrado ainda. Gere e avalie roteiros para o agente aprender.
          </p>
        ) : (
          <>
            {/* Contadores */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{padroes.totalAprovados}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">Aprovados</p>
              </div>
              <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-center">
                <p className="text-2xl font-bold text-rose-400">{padroes.totalRecusados}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">Recusados</p>
              </div>
            </div>

            {/* Top motivos positivos */}
            {padroes.motivosPositivos.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                  O que mais agradou
                </p>
                <div className="flex flex-col gap-1.5">
                  {padroes.motivosPositivos.map(([motivo, count]) => (
                    <div key={motivo} className="flex items-center justify-between
                                                  bg-zinc-950 border border-zinc-800 rounded px-3 py-2">
                      <span className="text-xs text-zinc-400">{motivo}</span>
                      <span className="text-xs font-bold text-emerald-500">{count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top motivos negativos */}
            {padroes.motivosNegativos.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                  O que não funcionou
                </p>
                <div className="flex flex-col gap-1.5">
                  {padroes.motivosNegativos.map(([motivo, count]) => (
                    <div key={motivo} className="flex items-center justify-between
                                                  bg-zinc-950 border border-zinc-800 rounded px-3 py-2">
                      <span className="text-xs text-zinc-400">{motivo}</span>
                      <span className="text-xs font-bold text-rose-500">{count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Últimos aprovados */}
            {padroes.ultimosAprovados.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                  Últimos temas aprovados
                </p>
                <div className="flex flex-col gap-1">
                  {padroes.ultimosAprovados.map((tema, i) => (
                    <p key={i} className="text-xs text-zinc-500 pl-2 border-l border-emerald-900">
                      {tema}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
