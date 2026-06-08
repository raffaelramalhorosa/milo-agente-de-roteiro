import { useState } from 'react'

const OPCOES_APROVADO = ['Tema ótimo', 'Tom de voz perfeito', 'Tamanho ideal', 'Início que prende']
const OPCOES_RECUSADO = ['Tema não combina', 'Tom de voz errado', 'Muito longo ou curto', 'Início não prende']

export default function FeedbackView({ aprovado, onConfirmar }) {
  const [selecionados, setSelecionados] = useState([])
  const [outro, setOutro]               = useState('')

  const opcoes = aprovado ? OPCOES_APROVADO : OPCOES_RECUSADO

  function toggle(opcao) {
    setSelecionados(prev =>
      prev.includes(opcao) ? prev.filter(o => o !== opcao) : [...prev, opcao]
    )
  }

  return (
    <div className="animate-fade-slide-up">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
        {aprovado ? '👍 O que funcionou?' : '👎 O que não funcionou?'}
      </p>

      <div className="flex flex-col gap-2">
        {opcoes.map((opcao, i) => {
          const marcado = selecionados.includes(opcao)
          return (
            <label
              key={opcao}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer
                          text-sm select-none transition-colors animate-fade-slide-up
                          ${marcado
                            ? 'border-accent bg-accent-dim text-zinc-100'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'}`}
            >
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer accent-accent"
                checked={marcado}
                onChange={() => toggle(opcao)}
              />
              {opcao}
            </label>
          )
        })}
      </div>

      <input
        type="text"
        placeholder="Outro motivo (opcional)"
        value={outro}
        onChange={e => setOutro(e.target.value)}
        className="mt-3 w-full px-4 py-3 rounded-md border border-zinc-800 bg-zinc-900
                   text-sm text-zinc-200 placeholder:text-zinc-600
                   focus:outline-none focus:border-accent transition-colors"
      />

      <button className="btn-confirm" onClick={() => onConfirmar(selecionados, outro)}>
        Confirmar
      </button>
    </div>
  )
}
