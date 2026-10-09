import { ArrowRight, BadgeCheck, Clock, FileX2, HandCoins, Sparkles } from 'lucide-react'
import { Button } from '../components/ui'
import { ProductIcon } from '../components/bundle'
import { PRODUCTS } from '../data/products'
import { config } from '../config'
import { useStore } from '../state/store'

export function Engage() {
  const { go } = useStore()
  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_60%_at_70%_0%,#d1fae9_0%,transparent_70%),radial-gradient(40%_50%_at_0%_30%,#ecfdf6_0%,transparent_70%)]" />
      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:pt-24">
        <section className="min-w-0 animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800 shadow-card ring-1 ring-brand-100">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Ready-made plans · one monthly price
          </span>
          <h1 className="mt-5 font-display text-[44px] font-extrabold leading-[1.02] tracking-tight text-ink-950 sm:text-6xl">
            Cover, sorted in <span className="relative whitespace-nowrap text-brand-700">under 2 minutes.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600 sm:text-xl">No forms. No paperwork. Just a few quick questions.</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={() => go('recommend')} className="sm:w-auto" block icon={null}>
              Get my price <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
            <p className="text-center text-sm text-ink-500 sm:text-left">Free quote · no ID or contact details needed</p>
          </div>

          <ul className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-sm">
            {[
              { icon: Clock, t: 'Quote in 60s' },
              { icon: FileX2, t: 'Zero paperwork' },
              { icon: HandCoins, t: `Paid in ${config.promises.claimPayoutHours}h` },
            ].map(({ icon: I, t }) => (
              <li key={t} className="flex flex-col items-start gap-2 rounded-xl bg-white/70 p-3 ring-1 ring-ink-100">
                <I className="h-5 w-5 text-brand-600" aria-hidden />
                <span className="font-semibold text-ink-800">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="What you can bundle" className="relative min-w-0 animate-fade-up [animation-delay:120ms]">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-100/60 to-white blur-2xl" />
          <div className="rounded-3xl bg-white p-6 shadow-lift ring-1 ring-ink-100">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold text-ink-950">What you can cover</p>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800">Ready-made plans</span>
            </div>
            <ul className="mt-5 space-y-2.5">
              {PRODUCTS.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-ink-100 animate-fade-up"
                  style={{ animationDelay: `${200 + i * 70}ms` }}
                >
                  <ProductIcon id={p.id} />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">{p.name}</p>
                    <p className="truncate text-sm text-ink-500">{p.tagline}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
              <BadgeCheck className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
              One policy. One debit order. One ID check.
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-ink-100 bg-white/60">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-ink-500">
          {config.brand} is an authorised financial services provider ({config.brandFsp}). Cover is underwritten by {config.underwriter.name} ({config.underwriter.fsp}), a
          licensed microinsurer. Benefits are paid as fixed amounts on a covered event.
        </p>
      </footer>
    </div>
  )
}
