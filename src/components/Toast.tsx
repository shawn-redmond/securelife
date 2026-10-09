import { useEffect, useState } from 'react'
import { MessageSquareText, X } from 'lucide-react'

type ToastMsg = { id: number; title: string; body: string }
let push: ((t: Omit<ToastMsg, 'id'>) => void) | null = null

/** Simulated SMS / email notifications so the demo can be run end-to-end without a backend. */
export const notify = (title: string, body: string) => push?.({ title, body })

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([])
  useEffect(() => {
    push = (t) => {
      const id = Date.now() + Math.random()
      setItems((xs) => [...xs, { ...t, id }])
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 9000)
    }
    return () => {
      push = null
    }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink-950/95 p-4 text-white shadow-lift backdrop-blur animate-fade-up">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500">
            <MessageSquareText className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-300">{t.title}</p>
            <p className="mt-0.5 text-sm leading-snug">{t.body}</p>
          </div>
          <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))} className="text-ink-400 hover:text-white" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
