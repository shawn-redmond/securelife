import { useEffect, useState } from 'react'
import { FamilyPanel } from '../components/FamilyEditor'
import { familyCount, familyLines, familyPremium } from '../data/family'
import { Check, MessageCircle, PhoneCall, Plus, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import { Screen } from '../components/shell'
import { ProductIcon } from '../components/bundle'
import { Button, Card, LinkButton } from '../components/ui'
import { PRODUCTS, productById, sortProducts, type ProductId } from '../data/products'
import { capFor, capUsed, quoteBundle, sumAssuredOf } from '../lib/pricing'
import { config } from '../config'
import { cx, rand, randShort } from '../lib/format'
import { branchComplete, heldProducts, questionList, useStore } from '../state/store'

export function Quote() {
  const { state, set } = useStore()
  const { app } = state
  const held = heldProducts(state)
  const q = quoteBundle(app.selected, app.answers, state.demo.pricingUnavailable, app.family)
  const upsell = PRODUCTS.filter((p) => !app.selected.includes(p.id) && !held.includes(p.id))
  const lifeUsed = capUsed('life', app.selected, app.answers)
  const plan = app.plan
  const customised =
    !!plan &&
    (app.selected.length !== Object.keys(plan.covers).length ||
      app.selected.some((id) => plan.covers[id] !== sumAssuredOf(id, app.answers[id])))

  // Guard: every selected product's answers must exist before a quote is shown.
  useEffect(() => {
    const list = questionList(app.selected)
    const firstGap = list.findIndex((it) => !branchComplete(it.product, app.answers) && it.local === 0)
    if (app.selected.length && firstGap >= 0) set((s) => ({ step: 'questions', app: { ...s.app, qIndex: firstGap, onlySteps: null } }))
  }, [app.selected, app.answers, set])

  const add = (id: ProductId) =>
    set((s) => {
      const selected = sortProducts([...s.app.selected, id])
      const list = questionList(selected)
      return { step: 'questions', app: { ...s.app, selected, qIndex: list.findIndex((it) => it.product === id), returnToQuote: id, onlySteps: null } }
    })

  const remove = (id: ProductId) => set((s) => ({ app: { ...s.app, selected: s.app.selected.filter((x) => x !== id) } }))

  const adjust = () => set((s) => ({ step: 'questions', app: { ...s.app, qIndex: 0, returnToQuote: null, onlySteps: null } }))

  if (!app.selected.length)
    return (
      <Screen title="Your policy has no benefits yet" subtitle="Add at least one benefit to see your price.">
        <Button onClick={() => set(() => ({ step: 'pick' }))}>Choose cover</Button>
      </Screen>
    )

  const canProceed = q.priced.length > 0

  return (
    <Screen
      wide
      eyebrow={
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
          {plan ? (customised ? `Your plan · based on ${plan.name}` : `Your ${plan.name} plan`) : 'Your quote is ready'}
        </p>
      }
      title={
        <>
          <span className="tabular-nums">{rand(q.total)}</span>
          <span className="text-ink-500"> /month</span>
        </>
      }
      subtitle={`${q.priced.length} benefit${q.priced.length === 1 ? '' : 's'} on one policy · one monthly debit · cancel anytime`}
      footer={
        <div className="space-y-3">
          <Button block disabled={!canProceed} onClick={() => set(() => ({ step: 'contact' }))}>
            Get covered now
          </Button>
          <div className="text-center">
            <LinkButton onClick={adjust}>{plan ? 'Change amounts' : 'Adjust my cover'}</LinkButton>
          </div>
        </div>
      }
    >
      <Card className="divide-y divide-ink-100">
        {q.lines.map(({ id, result }) => {
          const p = productById[id]
          return (
            <div key={id} className="p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <ProductIcon id={id} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-950">{p.name}</p>
                  <p className="text-sm text-ink-500">{result.ok ? `${randShort(result.sumAssured)} fixed benefit` : 'Needs a quick chat'}</p>
                </div>
                {result.ok ? (
                  <p className="text-right font-display text-lg font-bold tabular-nums text-ink-950">
                    {rand(result.monthly)}
                    <span className="block text-xs font-medium text-ink-500">/month</span>
                  </p>
                ) : (
                  <TriangleAlert className="h-5 w-5 text-amber-500" aria-label="Price unavailable" />
                )}
                <button
                  onClick={() => remove(id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${p.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {id === 'life' && result.ok && familyCount(app.family) > 0 && (
                <ul className="ml-[60px] mt-3 space-y-1.5 border-l-2 border-violet-100 pl-3 text-sm">
                  <li className="flex justify-between gap-3 text-ink-600">
                    <span>You · {randShort(result.sumAssured)}</span>
                    <span className="tabular-nums">{rand(result.monthly - familyPremium(app.family))}</span>
                  </li>
                  {familyLines(app.family).map((l) => (
                    <li key={l.key} className="flex justify-between gap-3 text-ink-600">
                      <span className="min-w-0">
                        {l.label} · {randShort(l.amount)}
                      </span>
                      <span className="tabular-nums">{rand(l.monthly)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!result.ok && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
                  <p>{result.reason} The rest of your policy isn’t affected — we’ll sort this one out with you directly.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={config.support.whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-ink-900 ring-1 ring-inset ring-amber-300"
                    >
                      <MessageCircle className="h-4 w-4 text-brand-600" /> WhatsApp us
                    </a>
                    <CallbackButton />
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div className="flex items-center justify-between bg-ink-50/60 p-4 sm:p-5">
          <span className="font-semibold text-ink-800">Total per month</span>
          <span className="font-display text-2xl font-extrabold tabular-nums text-ink-950">{rand(q.total)}</span>
        </div>
      </Card>

      {app.selected.includes('life') && (
        <FamilyPanel
          className="mt-5"
          family={app.family}
          reliesOnYou={app.profile.dependants}
          onChange={(f) => set((s) => ({ app: { ...s.app, family: f } }))}
        />
      )}

      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-ink-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <span>
          Underwritten by {config.underwriter.name}. No hidden fees, no admin charges — the price you see is what you pay.
        </span>
      </p>

      {lifeUsed > 0 && (
        <div className="mt-5 rounded-xl bg-white p-4 ring-1 ring-ink-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-700">Life-type cover used</span>
            <span className="tabular-nums text-ink-600">
              {rand(lifeUsed)} of {rand(capFor('life'))}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
            <div className={cx('h-full rounded-full transition-all', lifeUsed > capFor('life') ? 'bg-rose-500' : 'bg-brand-500')} style={{ width: `${Math.min(100, (lifeUsed / capFor('life')) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-500">Microinsurance rules cap combined life-type benefits per person. We keep your policy within the limit automatically.</p>
        </div>
      )}

      {upsell.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink-950">Add more benefits</h2>
          <p className="mt-1 text-sm text-ink-600">They go on the same policy, with one debit and no extra paperwork.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {upsell.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                className="group flex items-center gap-3 rounded-2xl border-2 border-dashed border-ink-200 bg-white p-4 text-left transition hover:border-brand-400 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
              >
                <ProductIcon id={p.id} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink-900">{p.name}</span>
                  <span className="block truncate text-xs text-ink-500">{p.tagline}</span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
                <span className="sr-only">Add {p.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </Screen>
  )
}

function CallbackButton() {
  const [requested, setRequested] = useState(false)
  return (
    <button
      onClick={() => setRequested(true)}
      disabled={requested}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-ink-900 ring-1 ring-inset ring-amber-300 disabled:text-brand-800"
    >
      {requested ? <Check className="h-4 w-4 text-brand-600" /> : <PhoneCall className="h-4 w-4 text-brand-600" />}
      {requested ? 'We’ll call you within 1 working hour' : 'Request a call-back'}
    </button>
  )
}
