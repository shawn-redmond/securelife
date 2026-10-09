import { useMemo } from 'react'
import { Car, Check, Pencil, Sparkles } from 'lucide-react'
import { Screen } from '../components/shell'
import { ProductIcon } from '../components/bundle'
import { Alert, Button, LinkButton } from '../components/ui'
import { MOTOR_TIERS, PROFILE_QUESTIONS, buildPlans, missingSteps, motorPrice, planFooter, recommendTier, type Plan } from '../data/plans'
import type { AllAnswers } from '../lib/pricing'
import { FamilyPanel } from '../components/FamilyEditor'
import { familyCount, familyPremium } from '../data/family'
import { cx, rand } from '../lib/format'
import { forWhom, perDay } from '../lib/value'
import { config } from '../config'
import type { ProductId } from '../data/products'
import type { FamilyCover } from '../data/family'

const maxWaiting = (ids: ProductId[], family: FamilyCover | null) =>
  Math.max(...ids.map((id) => config.waiting[id].months), ...(family ? [...family.parents, ...family.extended].map((b) => config.waiting.family[b]) : []))
import { useStore } from '../state/store'

export function Plans() {
  const { state, set } = useStore()
  const { profile } = state.app
  const family = state.app.family
  // Family funeral lives ride on the funeral benefit, which every plan includes.
  const plans = useMemo(() => buildPlans(profile).map((pl) => ({ ...pl, monthly: pl.monthly + familyPremium(family) })), [profile, family])
  const famN = familyCount(family)
  const { tier, overBudget } = recommendTier(plans, profile.budget)

  const choose = (plan: Plan) =>
    set((s) => {
      const answers: AllAnswers = {}
      // Keep details already given (car, area) and apply the plan's amounts on top.
      for (const id of plan.products) answers[id] = { ...(s.app.answers[id] ?? {}), ...plan.answers[id] }
      const onlySteps = missingSteps(plan.products, answers)
      return {
        step: onlySteps.length ? 'questions' : 'quote',
        app: {
          ...s.app,
          selected: plan.products,
          answers,
          plan: { id: plan.id, name: plan.name, covers: Object.fromEntries(plan.benefits.map((b) => [b.product, b.amount])) },
          onlySteps,
          qIndex: 0,
          returnToQuote: null,
          skippedRecommender: false,
        },
      }
    })

  const buildOwn = () => set((s) => ({ step: 'pick', app: { ...s.app, skippedRecommender: true, plan: null, onlySteps: null, selected: [], qIndex: 0 } }))

  const chips = PROFILE_QUESTIONS.flatMap((q) => {
    if (q.id === 'about') return profile.ageBand ? [{ emoji: '🎂', label: profile.ageBand.replace('-', '–') }] : []
    if (q.id === 'budget') return []
    if (q.id === 'dependants')
      return (q.options ?? []).filter((o) => profile.dependants?.includes(o.value as never)).map((o) => ({ emoji: o.emoji, label: o.label }))
    const o = q.options?.find((x) => x.value === profile[q.id as 'travel' | 'home'])
    return o ? [{ emoji: o.emoji, label: o.label }] : []
  })

  const budgetLabel = PROFILE_QUESTIONS.find((q) => q.id === 'budget')?.options?.find((o) => o.value === profile.budget)?.label

  return (
    <Screen
      xl
      eyebrow={
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-ink-700 ring-1 ring-ink-200">
              <span aria-hidden>{c.emoji}</span> {c.label}
            </span>
          ))}
          <button
            onClick={() => set((s) => ({ step: 'recommend', app: { ...s.app, rIndex: 0 } }))}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit answers
          </button>
        </div>
      }
      title={`Plans for ${forWhom(profile.dependants)}`}
      subtitle="Prices are set for your answers and won’t change at checkout. You can change any amount after choosing."
    >
      {overBudget && (
        <Alert tone="warning" className="mb-6" title={`Our lowest plan is ${rand(plans[0].monthly)} a month`}>
          That’s a bit over your {budgetLabel?.toLowerCase()} budget. You can choose Essential and remove a cover on the next screen, or build your own with a single cover.
        </Alert>
      )}

      {profile.travel === 'car' && (
        <section aria-labelledby="motor-addon" className="mb-8 rounded-2xl bg-white p-4 ring-1 ring-ink-200 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
              <Car className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="motor-addon" className="font-semibold text-ink-950">
                Add car cover to any plan
              </h2>
              <p className="text-sm text-ink-600">A fixed payout if your car is stolen or written off. Optional, and you can add it later.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-labelledby="motor-addon">
            {[0, ...MOTOR_TIERS].map((amt) => {
              const on = (profile.motor ?? 0) === amt
              return (
                <label
                  key={amt}
                  className={cx(
                    'flex min-h-[56px] cursor-pointer flex-col items-center justify-center rounded-xl px-2 text-center ring-1 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30',
                    on ? 'bg-brand-50 ring-2 ring-brand-600' : 'bg-white ring-ink-200 hover:ring-ink-300',
                  )}
                >
                  <input
                    type="radio"
                    name="motor"
                    className="sr-only"
                    checked={on}
                    onChange={() => set((s) => ({ app: { ...s.app, profile: { ...s.app.profile, motor: amt || undefined } } }))}
                  />
                  <span className="text-[15px] font-semibold text-ink-900">{amt ? `R${amt.toLocaleString('en-ZA')}` : 'No thanks'}</span>
                  {amt > 0 && <span className="text-xs tabular-nums text-ink-500">+{rand(motorPrice(profile, amt))}/mo</span>}
                </label>
              )
            })}
          </div>
        </section>
      )}

      <FamilyPanel
        className="mb-8"
        family={family}
        reliesOnYou={profile.dependants}
        onChange={(f) => set((s) => ({ app: { ...s.app, family: f } }))}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
        {plans.map((plan, i) => {
          const rec = plan.id === tier
          return (
            <article
              key={plan.id}
              aria-label={`${plan.name} plan`}
              className={cx(
                'relative flex min-w-0 flex-col rounded-3xl bg-white p-5 animate-fade-up sm:p-6',
                rec ? 'order-first shadow-lift ring-2 ring-brand-600 lg:order-none' : 'shadow-card ring-1 ring-ink-200',
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {rec && (
                <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-brand-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> Recommended for you
                </span>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-extrabold text-ink-950">{plan.name}</h2>
                <p className="text-right">
                  <span className="font-display text-3xl font-extrabold tabular-nums text-ink-950">{rand(plan.monthly)}</span>
                  <span className="text-sm font-medium text-ink-500">/mo</span>
                  <span className="block text-xs font-medium text-ink-500">about R{perDay(plan.monthly)} a day</span>
                </p>
              </div>
              <p className="mt-2 text-[15px] font-medium leading-snug text-ink-800">{plan.pitch}</p>

              <ul className="mt-5 flex-1 space-y-3.5">
                {plan.benefits.map((b) => (
                  <li key={b.product} className="flex gap-3">
                    <ProductIcon id={b.product} size="sm" />
                    <span className="text-[15px] leading-snug text-ink-800">
                      {b.line}
                      {b.product === 'life' && famN > 0 && (
                        <span className="mt-0.5 block text-sm font-medium text-violet-700">
                          + funeral cover for {famN === 1 ? '1 family member' : `${famN} family members`}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-600">
                Accidents are covered from day one. Other claims have a waiting period of up to {maxWaiting(plan.products, family)} months.
              </p>
              <Button className="mt-4" block variant={rec ? 'primary' : 'secondary'} size="md" onClick={() => choose(plan)}>
                Choose {plan.name}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
                <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden /> {plan.benefits.length} benefits · one policy · one debit
              </p>
            </article>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs text-ink-500">{planFooter}</p>
      <div className="mt-3 pb-4 text-center">
        <LinkButton onClick={buildOwn} className="text-[15px]">
          Build my own instead
        </LinkButton>
      </div>
    </Screen>
  )
}
