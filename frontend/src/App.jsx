import { useState, useEffect } from 'react'
import Spinner from './components/Spinner'
import TemaCards from './components/TemaCards'
import RoteiroView from './components/RoteiroView'
import FeedbackView from './components/FeedbackView'
import Historico from './components/Historico'
import Modal from './components/Modal'
import PainelConfig from './components/PainelConfig'
import ErrorToast from './components/ErrorToast'

const ERROS = {
  semConexao:   'Não foi possível conectar ao servidor. Verifique se ele está rodando.',
  rateLimit:    'O Milo está sobrecarregado. Aguarde alguns segundos e tente de novo.',
  buscarTemas:  'O Milo não conseguiu buscar temas. Tente novamente.',
  gerarRoteiro: 'O Milo não conseguiu escrever o roteiro. Tente novamente.',
  salvarDecisao:'Não foi possível salvar sua decisão. Tente novamente.',
}

const TEXTOS_TEMAS   = ['Milo está pesquisando...', 'Buscando na web...', 'Filtrando os melhores...', 'Quase lá...']
const TEXTOS_ROTEIRO = ['Milo está escrevendo...', 'Criando o gancho...', 'Desenvolvendo a história...', 'Quase pronto...']

function carregarContextoSalvo() {
  return {
    temas:   localStorage.getItem('vsg_contexto_temas')   || '',
    roteiro: localStorage.getItem('vsg_contexto_roteiro') || '',
    jargoes: localStorage.getItem('vsg_contexto_jargoes') || '',
  }
}

export default function App() {
  const [tela, setTela]            = useState('inicial')
  const [temas, setTemas]          = useState([])
  const [temaSelecionado, setTema] = useState(null)
  const [roteiro, setRoteiro]      = useState('')
  const [aprovado, setAprovado]    = useState(null)
  const [historico, setHistorico]  = useState([])
  const [modalItem, setModalItem]  = useState(null)
  const [menuAberto, setMenu]      = useState(false)
  const [contexto, setContexto]    = useState(carregarContextoSalvo)
  const [erro, setErro]            = useState(null)

  function mostrarErro(chave) { setErro({ id: Date.now(), mensagem: ERROS[chave] }) }

  useEffect(() => { carregarHistorico() }, [])

  function atualizarContexto(chave, valor) {
    localStorage.setItem(`vsg_contexto_${chave}`, valor)
    setContexto(prev => ({ ...prev, [chave]: valor }))
  }

  async function carregarHistorico() {
    const resp = await fetch('/historico')
    setHistorico(await resp.json())
  }

  async function sugerirTemas() {
    setTela('carregandoTemas')
    try {
      const resp  = await fetch('/sugerir-temas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexto_temas: contexto.temas || null }),
      })
      const dados = await resp.json()
      if (!resp.ok) {
        mostrarErro(resp.status === 429 ? 'rateLimit' : 'buscarTemas')
        setTela('inicial')
        return
      }
      setTemas(dados.temas)
      setTela('temas')
    } catch {
      mostrarErro('semConexao')
      setTela('inicial')
    }
  }

  async function escolherTema(tema) {
    setTema(tema)
    setTela('carregandoRoteiro')
    try {
      const resp  = await fetch('/gerar-roteiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:           tema.titulo,
          resumo:           tema.resumo,
          contexto_jargoes: contexto.jargoes  || null,
          contexto_roteiro: contexto.roteiro  || null,
        }),
      })
      const dados = await resp.json()
      if (!resp.ok) {
        mostrarErro(resp.status === 429 ? 'rateLimit' : 'gerarRoteiro')
        setTela('temas')
        return
      }
      setRoteiro(dados.roteiro)
      setTela('roteiro')
    } catch {
      mostrarErro('semConexao')
      setTela('temas')
    }
  }

  async function confirmarDecisao(motivos, motivoOutro) {
    try {
      const resp = await fetch('/decidir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema:        temaSelecionado.titulo,
          resumo_tema: temaSelecionado.resumo,
          roteiro,
          aprovado,
          motivos,
          motivo_outro: motivoOutro,
        }),
      })
      if (!resp.ok) {
        mostrarErro('salvarDecisao')
        return
      }
    } catch {
      mostrarErro('semConexao')
      return
    }
    setTela('confirmado')
    carregarHistorico()
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-10 pb-24">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3">
              <img src="/milo_logo.png" alt="Milo" className="h-11 w-auto rounded-xl" />
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Milo</h1>
            </div>
            <p className="text-zinc-500 mt-1 text-sm">Gerador de roteiros para vídeos curtos</p>
          </div>
          <button
            onClick={() => setMenu(true)}
            className="mt-1 p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800
                       rounded-md transition-colors text-xl leading-none"
            title="Personalizar o Milo"
          >
            ☰
          </button>
        </div>

        {tela === 'inicial' && (
          <button className="btn-primary" onClick={sugerirTemas}>
            Sugerir temas
          </button>
        )}

        {tela === 'carregandoTemas'   && <Spinner textos={TEXTOS_TEMAS} />}
        {tela === 'temas'             && <TemaCards temas={temas} onEscolher={escolherTema} />}
        {tela === 'carregandoRoteiro' && <Spinner textos={TEXTOS_ROTEIRO} />}

        {tela === 'roteiro' && (
          <RoteiroView
            tema={temaSelecionado.titulo}
            roteiro={roteiro}
            onAprovar={() => { setAprovado(true);  setTela('feedback') }}
            onRecusar={() => { setAprovado(false); setTela('feedback') }}
          />
        )}

        {tela === 'feedback' && (
          <FeedbackView aprovado={aprovado} onConfirmar={confirmarDecisao} />
        )}

        {tela === 'confirmado' && (
          <div>
            <p className={`text-2xl font-bold py-7 ${aprovado ? 'text-emerald-400' : 'text-rose-400'}`}>
              {aprovado ? '✓ Roteiro aprovado e salvo!' : '✗ Roteiro recusado e registrado.'}
            </p>
            <button className="btn-primary" onClick={() => setTela('inicial')}>
              Gerar novo roteiro
            </button>
          </div>
        )}

        <Historico historico={historico} onVerRoteiro={setModalItem} />
      </div>

      {modalItem && <Modal item={modalItem} onFechar={() => setModalItem(null)} />}

      {erro && (
        <ErrorToast
          key={erro.id}
          mensagem={erro.mensagem}
          onFechar={() => setErro(null)}
        />
      )}

      {menuAberto && (
        <PainelConfig
          contexto={contexto}
          onAtualizar={atualizarContexto}
          onFechar={() => setMenu(false)}
          historico={historico}
        />
      )}
    </div>
  )
}
