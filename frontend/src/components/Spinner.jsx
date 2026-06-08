import { useState, useEffect } from 'react'

export default function Spinner({ textos }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % textos.length), 3000)
    return () => clearInterval(id)
  }, [textos])

  return (
    <div className="flex flex-col items-center gap-4 py-16 animate-fade-in">
      <div className="w-10 h-10 border-2 border-zinc-800 border-t-accent rounded-full animate-spin" />
      <p className="text-sm text-zinc-500 tracking-wide">{textos[idx]}</p>
    </div>
  )
}
