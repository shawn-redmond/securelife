import { useMemo } from 'react'
import { Check, Pencil, Sparkles } from 'lucide-react'
import { Screen } from '../components/shell'
import { ProductIcon } from '../components/bundle'
import { Alert, Button, LinkButton } from '../components/ui'
import { PROFILE_QUESTIONS, buildPlans, missingSteps, planFooter, recommendTier, type Plan } from '../data/plans'
import type { AllAnswers } from '../lib/pricing'
import { cx, rand } from '../lib/format'
import { useStore } from '../state/store'

export function Plans() {
  const { state, set } = useStore()
  const { profile } = state.app
  const plans = useMemo(() => buildPlans(profile), [profile])
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
    const o = q.options?.find((x) => x.value === profile[q.id as "travel" | "dependants" | "home"])
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
      title="Pick your plan"
      subtitle="Prices are set for your answers and won’t change at checkout. You can change any amount after choosing."
    >
      {overBudget && (
        <Alert tone="warning" className="mb-6" title={`Our lowest plan is ${rand(plans[0].monthly)} a month`}>
          That’s a bit over your {budgetLabel?.toLowerCase()} budget. You can choose Essential and remove a cover on the next screen, or build your own with a single cover.
        </Alert>
      )}

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
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-600">{plan.pitch}</p>

              <ul className="mt-5 flex-1 space-y-3.5">
                {plan.benefits.map((b) => (
                  <li key={b.product} className="flex gap-3">
                    <ProductIcon id={b.product} size="sm" />
                    <span className="text-[15px] leading-snug text-ink-800">{b.line}</span>
                  </li>
                ))}
                {profile.travel === 'car' && !plan.products.includes('motor') && (
                  <li className="pl-11 text-sm text-ink-500">Car cover can be added on the next screen.</li>
                )}
              </ul>

              <Button className="mt-6" block variant={rec ? 'primary' : 'secondary'} size="md" onClick={() => choose(plan)}>
                Choose {plan.name}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
                <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden /> {plan.benefits.length} covers · one debit
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
