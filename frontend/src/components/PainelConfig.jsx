import { useState } from 'react'
import SecaoConfig from './SecaoConfig'
import AbaOQueSei from './AbaOQueSei'

const ABAS = [
  {
    id:    'temas',
    label: '🎯 Temas',
    titulo:   'Busca de Temas',
    descricao: "Defina quais tipos de temas o agente deve buscar e o que deve evitar. Pode usar Do's and Don'ts.",
    placeholder: `# Tipos de conteúdo
- Histórias de superação no empreendedorismo
- Curiosidades sobre tecnologia

## ✅ Pode usar
- Histórias recentes (2024-2025)
- Temas com dados concretos

## ❌ Evitar
- Política e polêmica
- Conteúdo muito técnico`,
    dica: `Preciso de um arquivo markdown para configurar um agente gerador de roteiros de vídeos curtos no Instagram.

Crie um arquivo tipos_de_conteudo.md com base no meu perfil:

Meu nicho: [ex: empreendedorismo, tecnologia, lifestyle]
Minha audiência: [ex: empreendedores iniciantes, jovens de 18–30 anos]
Tipos de história que me identifico: [ex: superação, bastidores, curiosidades]

O arquivo deve ter:
- Lista clara dos tipos de conteúdo que quero abordar
- ## ✅ Pode usar — temas, épocas e contextos que combinam comigo
- ## ❌ Evitar — assuntos, tons ou contextos que não quero

Use bullets curtos e objetivos. O agente vai ler esse arquivo para buscar temas na web.`,
  },
  {
    id:    'roteiro',
    label: '📋 Roteiro',
    titulo:   'Estrutura do Roteiro',
    descricao: 'Defina como o roteiro deve ser estruturado: seções obrigatórias, duração de cada parte, formato.',
    placeholder: `# Estrutura do roteiro
- Gancho: pergunta ou afirmação impactante (0–5s)
- Desenvolvimento: história ou contexto (5–35s)
- Virada: o insight ou resultado surpreendente (35–42s)
- CTA: chamada à ação direta (42–45s)

## ✅ Pode usar
- Pausas dramáticas com "..."
- Repetição para ênfase

## ❌ Evitar
- Roteiros acima de 60 segundos
- Introduções longas`,
    dica: `Preciso de um arquivo markdown para definir como quero que meus roteiros sejam estruturados.

Crie um arquivo estrutura_roteiro.md com base nas minhas preferências:

Duração dos meus vídeos: [ex: 30s, 45s, 60s]
Plataforma principal: [ex: Instagram Reels, TikTok, YouTube Shorts]
Estilo de apresentação: [ex: storytelling, educativo, humor, provocação]
Elementos obrigatórios: [ex: gancho forte, dado surpresa, CTA no final]

O arquivo deve ter:
- Estrutura das seções do roteiro com duração sugerida para cada parte
- ## ✅ Pode usar — recursos narrativos, formatos e técnicas que funcionam
- ## ❌ Evitar — erros comuns e elementos que não combinam com meu estilo

O agente vai usar esse arquivo como guia para escrever todos os meus roteiros.`,
  },
  {
    id:    'jargoes',
    label: '🗣️ Jargões',
    titulo:   'Jargões e Falas',
    descricao: "Tom de voz, frases características e palavras que a pessoa usa — ou quer evitar.",
    placeholder: `# Estilo de fala
- Tom descontraído e direto
- Frases curtas, sem enrolação

## ✅ Usar sempre
- "bora", "sacou?", "presta atenção nisso"
- Começa sempre com uma pergunta

## ❌ Nunca usar
- "Olá, tudo bem?"
- Linguagem formal ou corporativa`,
    dica: `Preciso de um arquivo markdown com o meu estilo de fala para um agente que escreve roteiros no meu lugar.

Crie um arquivo estilo_de_fala.md com base na minha personalidade de comunicação:

Como me apresento: [ex: direto, descontraído, técnico, motivacional]
Expressões que uso muito: [ex: "bora", "na prática", "olha só", "para tudo"]
Como começo os vídeos: [ex: com pergunta, com afirmação polêmica, com dado impactante]
Minhas referências de comunicação: [ex: nomes de criadores que admiro]

O arquivo deve ter:
- Descrição do tom, ritmo e estilo da minha fala
- ## ✅ Usar sempre — expressões, estruturas de frase e abordagens que são minhas
- ## ❌ Nunca usar — linguagem que não é minha, formalismos, clichês que detesto

O agente vai usar esse arquivo para escrever exatamente como eu falaria.`,
  },
]

const ABA_O_QUE_SEI = { id: 'oquesei', label: '🧠 O que eu sei' }

export default function PainelConfig({ contexto, onAtualizar, onFechar, historico }) {
  const [abaAtiva, setAbaAtiva]   = useState('temas')
  const [dicaAberta, setDica]     = useState(null)
  const [copiado, setCopiado]     = useState(false)

  const aba      = ABAS.find(a => a.id === abaAtiva)
  const abaDica  = ABAS.find(a => a.id === dicaAberta)

  function toggleDica(id, e) {
    e.stopPropagation()
    setDica(prev => prev === id ? null : id)
    setCopiado(false)
  }

  function copiarPrompt() {
    navigator.clipboard.writeText(abaDica.dica)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in" onClick={onFechar} />

      <div className="fixed inset-y-0 right-0 w-full md:w-[520px] bg-zinc-900
                      border-l border-zinc-800 z-50 flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-100">Personalizar o Milo</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Salvo automaticamente no navegador</p>
          </div>
          <button
            onClick={onFechar}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-zinc-800 px-2 overflow-x-auto">
          {[...ABAS, ABA_O_QUE_SEI].map(a => (
            <div key={a.id} className="flex items-center shrink-0">
              <button
                onClick={() => { setAbaAtiva(a.id); setDica(null) }}
                className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider
                            transition-colors border-b-2 -mb-px
                  ${abaAtiva === a.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                {a.label}
              </button>

              {/* Botão ? — só nas abas que têm dica */}
              {a.dica && <button
                onClick={e => toggleDica(a.id, e)}
                title="Ver prompt para gerar este arquivo"
                className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center
                            mr-2 transition-colors shrink-0
                            ${dicaAberta === a.id
                              ? 'bg-accent text-white'
                              : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200'}`}
              >
                ?
              </button>}
            </div>
          ))}
        </div>

        {/* Painel da dica */}
        {dicaAberta && (
          <div className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 animate-fade-slide-up">
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
              Prompt para gerar este arquivo
            </p>
            <p className="text-xs text-zinc-600 mb-3">
              Cole no Claude Code (ou qualquer LLM), preencha os colchetes e importe o resultado aqui.
            </p>
            <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed
                            bg-zinc-900 border border-zinc-800 rounded-md p-4 mb-3 max-h-52 overflow-y-auto">
              {abaDica?.dica}
            </pre>
            <button
              onClick={copiarPrompt}
              className={`text-xs px-3 py-2 rounded-md font-semibold transition-colors
                          ${copiado
                            ? 'bg-emerald-900 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-accent hover:text-accent'}`}
            >
              {copiado ? '✓ Copiado!' : 'Copiar prompt'}
            </button>
          </div>
        )}

        {/* Conteúdo da aba */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {abaAtiva === 'oquesei' ? (
            <AbaOQueSei
              contexto={contexto}
              onAtualizar={onAtualizar}
              historico={historico}
            />
          ) : aba ? (
            <SecaoConfig
              titulo={aba.titulo}
              descricao={aba.descricao}
              placeholder={aba.placeholder}
              valor={contexto[aba.id]}
              onChange={val => onAtualizar(aba.id, val)}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
