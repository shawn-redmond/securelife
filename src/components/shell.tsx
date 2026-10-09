import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, CloudCheck, MessageCircle, ShieldCheck, X } from 'lucide-react'
import { config } from '../config'
import { cx, maskPhone } from '../lib/format'
import { DemoPanel } from './DemoPanel'
import { STEP_NUMBER, useStore, type StepId } from '../state/store'

const PHASES: { label: string; steps: StepId[] }[] = [
  { label: 'Your cover', steps: ['recommend', 'pick', 'questions'] },
  { label: 'Your price', steps: ['quote'] },
  { label: 'Your details', steps: ['contact', 'payment', 'verify'] },
  { label: 'Covered', steps: ['issued', 'kyc'] },
]

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-white shadow-sm">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      <span className="font-display text-[17px] font-extrabold tracking-tight text-ink-900">
        SecureLife<span className="text-brand-600"> Bundle</span>
      </span>
    </span>
  )
}

export function Header() {
  const { state, back, canGoBack } = useStore()
  const phaseIdx = PHASES.findIndex((p) => p.steps.includes(state.step))
  const showProgress = state.step !== 'engage'
  const saved = state.customer.contactVerified && STEP_NUMBER[state.step] >= 6 && state.step !== 'issued'
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <div className="w-10">
          {showProgress && canGoBack && (
            <button
              onClick={back}
              className="grid h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
              aria-label="Go back"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="flex min-w-0 flex-1 justify-start">
          <Logo />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <DemoPanel />
          {saved && (
            <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 md:inline-flex" title={`Resume link sent to ${maskPhone(state.customer.phone)}`}>
              <CloudCheck className="h-4 w-4" aria-hidden /> Progress saved
            </span>
          )}
          <a
            href={config.support.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-100"
          >
            <MessageCircle className="h-5 w-5 text-brand-600" aria-hidden />
            <span className="hidden sm:inline">Help</span>
          </a>
        </div>
      </div>
      {showProgress && (
        <nav aria-label="Progress" className="mx-auto max-w-6xl px-4 pb-3">
          <ol className="grid grid-cols-4 gap-1.5">
            {PHASES.map((p, i) => (
              <li key={p.label} className="min-w-0">
                <div className={cx('h-1.5 rounded-full transition-colors duration-500', i < phaseIdx ? 'bg-brand-600' : i === phaseIdx ? 'bg-brand-400' : 'bg-ink-100')} />
                <span
                  className={cx('mt-1.5 block truncate text-[11px] font-semibold uppercase tracking-wide', i <= phaseIdx ? 'text-brand-800' : 'text-ink-400')}
                  aria-current={i === phaseIdx ? 'step' : undefined}
                >
                  {p.label}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </header>
  )
}

/** Standard screen scaffold: title block, body, and a footer that sticks to the bottom on mobile. */
export function Screen({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  aside,
  wide,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  aside?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 justify-center gap-12 px-4 lg:py-6">
      <main className={cx('mx-auto flex w-full min-w-0 flex-1 flex-col', wide ? 'max-w-2xl' : 'max-w-xl', aside && 'lg:mx-0')}>
        <div key={String(title)} className="flex flex-1 flex-col animate-fade-up">
          <div className="pt-6 sm:pt-10">
            {eyebrow && <div className="mb-3">{eyebrow}</div>}
            <h1 className="font-display text-[28px] font-extrabold leading-[1.15] tracking-tight text-ink-950 sm:text-[34px]">{title}</h1>
            {subtitle && <p className="mt-3 text-[17px] leading-relaxed text-ink-600">{subtitle}</p>}
          </div>
          <div className="mt-7 flex-1">{children}</div>
        </div>
        {footer && (
          <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-ink-100 bg-white/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-10 sm:backdrop-blur-0">
            {footer}
          </div>
        )}
        {!footer && <div className="h-10" />}
      </main>
      {aside && <aside className="sticky top-32 hidden h-fit w-80 shrink-0 pt-10 lg:block">{aside}</aside>}
    </div>
  )
}

export function BotBubble({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [typing, setTyping] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setTyping(false), 650 + delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div className="flex items-end gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm" aria-hidden>
        <ShieldCheck className="h-5 w-5" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[15px] leading-relaxed text-ink-800 shadow-card ring-1 ring-ink-100" aria-live="polite">
        {typing ? (
          <span className="flex h-5 items-center gap-1" aria-label="Typing">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-300" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </span>
        ) : (
          <span className="animate-fade-up">{children}</span>
        )}
      </div>
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px] animate-fade-up" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-lift animate-fade-up sm:max-w-md sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink-950">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
