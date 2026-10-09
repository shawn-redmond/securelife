import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Screen } from '../components/shell'
import { BundleSummary, ProductIcon } from '../components/bundle'
import { Badge, Button, InlineError } from '../components/ui'
import { PRODUCTS, sortProducts, type ProductId } from '../data/products'
import { NAMED_BUNDLES } from '../data/recommender'
import { cx } from '../lib/format'
import { useStore } from '../state/store'

export function Pick() {
  const { state, set } = useStore()
  const { app } = state
  const held = state.held.map((p) => p.product)
  const [error, setError] = useState(false)
  const bundle = NAMED_BUNDLES.find((b) => b.name === app.bundleName)
  const addingMore = held.length > 0

  const toggle = (id: ProductId) => {
    setError(false)
    set((s) => {
      const sel = s.app.selected.includes(id) ? s.app.selected.filter((x) => x !== id) : sortProducts([...s.app.selected, id])
      return { app: { ...s.app, selected: sel } }
    })
  }

  const next = () => {
    if (!app.selected.length) return setError(true)
    set((s) => ({ step: 'questions', app: { ...s.app, qIndex: 0, returnToQuote: null } }))
  }

  return (
    <Screen
      title={addingMore ? 'Add more cover to your bundle' : app.skippedRecommender ? 'Build your bundle' : 'Here’s what we recommend'}
      subtitle={
        addingMore
          ? 'You’re already verified, so adding cover takes seconds — no ID check again.'
          : app.skippedRecommender
            ? 'Choose any mix of covers. You’ll see your price before we ask for any personal details.'
            : 'Pre-selected based on your answers — add or remove any cover.'
      }
      aside={<BundleSummary />}
      footer={
        <div className="space-y-3">
          {error && <InlineError>Choose at least one cover to continue</InlineError>}
          <Button block softDisabled={!app.selected.length} onClick={next}>
            Continue{app.selected.length > 0 && ` with ${app.selected.length} cover${app.selected.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      }
    >
      {bundle && !app.skippedRecommender && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 text-white shadow-lift animate-fade-up">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Your starter bundle</p>
            <p className="font-display text-xl font-bold">{bundle.name}</p>
            <p className="mt-0.5 text-sm text-brand-100">{bundle.blurb}</p>
          </div>
        </div>
      )}
      <fieldset>
        <legend className="sr-only">Covers</legend>
        <div className="space-y-3">
          {PRODUCTS.map((p, i) => {
            const isHeld = held.includes(p.id)
            const on = app.selected.includes(p.id)
            const recommended = app.recommended.includes(p.id)
            return (
              <label
                key={p.id}
                className={cx(
                  'flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 transition-all animate-fade-up has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30',
                  isHeld ? 'cursor-not-allowed opacity-60 ring-ink-100' : 'cursor-pointer',
                  !isHeld && (on ? 'shadow-card ring-2 ring-brand-600' : 'ring-ink-200 hover:ring-ink-300'),
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <input type="checkbox" className="sr-only" checked={on} disabled={isHeld} onChange={() => toggle(p.id)} />
                <ProductIcon id={p.id} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-bold text-ink-950">{p.name}</span>
                    {isHeld && <Badge tone="ink">Already covered</Badge>}
                    {!isHeld && recommended && <Badge>Recommended</Badge>}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-ink-600">{p.tagline}</span>
                </span>
                {!isHeld && (
                  <span
                    className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset transition', on ? 'bg-brand-700 ring-brand-700' : 'bg-white ring-ink-300')}
                    aria-hidden
                  >
                    <Check className={cx('h-4 w-4 text-white transition', on ? 'scale-100' : 'scale-0')} strokeWidth={3} />
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>
    </Screen>
  )
}
