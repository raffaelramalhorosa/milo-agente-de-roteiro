export default function RoteiroView({ tema, roteiro, onAprovar, onRecusar }) {
  return (
    <div className="animate-fade-slide-up">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
        Roteiro gerado · <span className="text-zinc-300">{tema}</span>
      </p>
      <div className="card px-6 py-5 whitespace-pre-wrap text-sm leading-7
                      text-zinc-300 mb-5 font-mono">
        {roteiro}
      </div>
      <div className="flex gap-3 flex-wrap">
        <button className="btn-approve" onClick={onAprovar}>👍 Aprovar</button>
        <button className="btn-reject"  onClick={onRecusar}>👎 Recusar</button>
      </div>
    </div>
  )
}
