import { useRef, useState } from 'react'

export default function SecaoConfig({ titulo, descricao, placeholder, valor, onChange }) {
  const inputRef = useRef(null)
  const [arrastando, setArrastando] = useState(false)
  const [pendente, setPendente]     = useState(null) // { conteudo, nome }

  function lerArquivos(arquivos) {
    Promise.all(arquivos.map(f => f.text())).then(conteudos => {
      const novo = conteudos.join('\n\n---\n\n')
      onChange(valor ? `${valor}\n\n---\n\n${novo}` : novo)
    })
  }

  function handleUpload(e) {
    const arquivos = Array.from(e.target.files)
    if (!arquivos.length) return
    lerArquivos(arquivos)
    e.target.value = ''
  }

  function handleDragOver(e) {
    e.preventDefault()
    if (!arrastando) setArrastando(true)
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setArrastando(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setArrastando(false)
    const arquivos = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.md') || f.name.endsWith('.txt')
    )
    if (!arquivos.length) return
    Promise.all(arquivos.map(f => f.text())).then(conteudos => {
      const novo = conteudos.join('\n\n---\n\n')
      if (valor) {
        setPendente({ conteudo: novo, nome: arquivos.map(f => f.name).join(', ') })
      } else {
        onChange(novo)
      }
    })
  }

  function confirmarSubstituicao() {
    onChange(pendente.conteudo)
    setPendente(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-zinc-100">{titulo}</h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{descricao}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => inputRef.current.click()}
          className="text-xs px-3 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700
                     rounded-md hover:bg-zinc-700 hover:border-accent transition-colors font-medium"
        >
          + Importar .md
        </button>
        {valor && (
          <button
            onClick={() => onChange('')}
            className="text-xs px-3 py-2 bg-zinc-800 text-zinc-500 border border-zinc-700
                       rounded-md hover:bg-zinc-700 transition-colors"
          >
            Limpar
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".md,.txt"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={14}
          className={`w-full px-4 py-3 rounded-md border bg-zinc-950
                     text-sm text-zinc-300 font-mono leading-relaxed resize-y
                     focus:outline-none transition-colors
                     placeholder:text-zinc-700 placeholder:font-sans
                     ${arrastando ? 'border-accent opacity-40' : 'border-zinc-800 focus:border-accent'}`}
        />
        {arrastando && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
                          rounded-md border-2 border-dashed pointer-events-none"
               style={{ borderColor: '#4f8ef7' }}>
            <span className="text-sm font-semibold" style={{ color: '#4f8ef7' }}>
              Soltar arquivo aqui
            </span>
            <span className="text-xs text-zinc-500 mt-1">.md ou .txt</span>
          </div>
        )}
      </div>

      {pendente && (
        <div className="border border-zinc-700 rounded-md px-4 py-3 bg-zinc-950 animate-fade-slide-up">
          <p className="text-sm text-zinc-400 mb-3">
            Substituir o conteúdo atual por{' '}
            <span className="text-zinc-200 font-mono text-xs">{pendente.nome}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmarSubstituicao}
              className="text-xs px-3 py-2 rounded-md text-white font-semibold transition-colors"
              style={{ backgroundColor: '#4f8ef7' }}
            >
              Substituir
            </button>
            <button
              onClick={() => setPendente(null)}
              className="text-xs px-3 py-2 rounded-md bg-zinc-800 text-zinc-400
                         border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!valor && (
        <p className="text-xs text-zinc-600">
          Vazio → agente usa o arquivo local correspondente.
        </p>
      )}
    </div>
  )
}
