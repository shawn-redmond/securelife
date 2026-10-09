import { ShieldCheck } from 'lucide-react'
import { productById, type ProductId } from '../data/products'
import { cx, rand } from '../lib/format'
import { branchComplete, useStore } from '../state/store'
import { priceProduct } from '../lib/pricing'
import { config } from '../config'

export function ProductIcon({ id, size = 'md' }: { id: ProductId; size?: 'sm' | 'md' | 'lg' }) {
  const p = productById[id]
  const Icon = p.icon
  const s = { sm: 'h-8 w-8 rounded-lg', md: 'h-11 w-11 rounded-xl', lg: 'h-14 w-14 rounded-2xl' }[size]
  const i = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-7 w-7' }[size]
  return (
    <span className={cx('grid shrink-0 place-items-center', s, p.tint.bg, p.tint.fg)} aria-hidden>
      <Icon className={i} />
    </span>
  )
}

/** Desktop side panel: live view of the bundle being built. */
export function BundleSummary() {
  const { state } = useStore()
  const { selected, answers } = state.app
  const lines = selected.map((id) => {
    const done = branchComplete(id, answers)
    const r = done ? priceProduct(id, answers[id], state.demo.pricingUnavailable.includes(id)) : null
    return { id, price: r && r.ok ? r.monthly : null, pending: !done, exception: r && !r.ok }
  })
  const total = lines.reduce((s, l) => s + (l.price ?? 0), 0)
  const anyPriced = lines.some((l) => l.price !== null)
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-100">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Your bundle</p>
      {selected.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">Choose at least one cover to start building your bundle.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center gap-3">
              <ProductIcon id={l.id} size="sm" />
              <span className="flex-1 text-sm font-semibold text-ink-800">{productById[l.id].name}</span>
              <span className="text-sm tabular-nums text-ink-600">
                {l.pending ? <span className="text-ink-400">—</span> : l.exception ? <span className="text-amber-600">Call-back</span> : rand(l.price!)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {anyPriced && (
        <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
          <span className="text-sm font-semibold text-ink-700">Monthly so far</span>
          <span className="font-display text-xl font-extrabold tabular-nums text-ink-950">{rand(total)}</span>
        </div>
      )}
      <div className="mt-5 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <span>
          One policy relationship, one debit, one ID check. Underwritten by {config.underwriter.name}.
        </span>
      </div>
    </div>
  )
}
