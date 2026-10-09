import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { Screen } from '../components/shell'
import { BundleSummary, ProductIcon } from '../components/bundle'
import { Button, InlineError, SelectField, TextField } from '../components/ui'
import { productById, type Field } from '../data/products'
import { capFor, capUsed, type Answers } from '../lib/pricing'
import { cx, rand } from '../lib/format'
import { isPostalCode } from '../lib/validation'
import { questionList, useStore } from '../state/store'

export function Questions() {
  const { state, set } = useStore()
  const { app } = state
  const list = useMemo(() => questionList(app.selected), [app.selected])
  const idx = Math.min(app.qIndex, Math.max(0, list.length - 1))
  const item = list[idx]

  useEffect(() => {
    if (!list.length) set(() => ({ step: 'pick' }))
  }, [list.length, set])

  if (!item) return null
  return <QuestionCard key={`${item.product}-${item.step.id}`} idx={idx} />
}

function QuestionCard({ idx }: { idx: number }) {
  const { state, set } = useStore()
  const { app } = state
  const list = questionList(app.selected)
  const item = list[idx]
  const product = productById[item.product]
  const saved = app.answers[item.product] ?? {}

  const initial = useMemo(() => {
    const d: Answers = {}
    for (const f of item.step.fields) {
      if (saved[f.id]) d[f.id] = saved[f.id]
      else if (f.shared) {
        // Pre-fill from another branch to save effort; this branch still stores its own answer.
        const other = Object.values(app.answers).find((a) => a?.[f.id])
        if (other) d[f.id] = other[f.id]
      }
    }
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [draft, setDraft] = useState<Answers>(initial)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const advancing = useRef(false)
  const prefilled = Object.keys(initial).some((k) => !saved[k])

  const cls = product.capClass
  const remaining = capFor(cls) - capUsed(cls, app.selected, app.answers, item.product)

  const fieldError = (f: Field, v: string | undefined): string | null => {
    if (!v) return f.kind === 'text' ? `Enter your ${f.label.toLowerCase()}` : 'Pick one to continue'
    if (f.id === 'postal' && !isPostalCode(v)) return 'Postal codes are 4 digits'
    if (f.sumAssured && cls === 'life' && Number(v) > remaining) return 'Choose a lower amount to stay within the shared limit'
    return null
  }
  const errors = item.step.fields.map((f) => fieldError(f, draft[f.id]))
  const valid = errors.every((e) => !e)

  const commit = (values: Answers) => {
    if (advancing.current) return
    advancing.current = true
    set((s) => {
      const answers = { ...s.app.answers, [item.product]: { ...(s.app.answers[item.product] ?? {}), ...values } }
      const next = idx + 1
      const ret = s.app.returnToQuote
      const leavingUpsellBranch = ret && (next >= list.length || list[next].product !== ret)
      if (next >= list.length || leavingUpsellBranch) return { step: 'quote', app: { ...s.app, answers, returnToQuote: null } }
      return { app: { ...s.app, answers, qIndex: next } }
    })
  }

  const submit = () => {
    setTouched(true)
    if (!valid) return setError(errors.find(Boolean) ?? 'Pick one to continue')
    commit(draft)
  }

  const single = item.step.fields.length === 1 && item.step.fields[0].kind === 'choice'
  const choose = (f: Field, v: string) => {
    setError(null)
    const nextDraft = { ...draft, [f.id]: v }
    setDraft(nextDraft)
    if (single) setTimeout(() => commit(nextDraft), 220)
  }

  // Progress across every selected branch, not just this one (spec §4.4).
  const segments = useMemo(() => {
    const seen: string[] = []
    for (const q of list) if (!seen.includes(q.product)) seen.push(q.product)
    return seen.map((pid) => {
      const items = list.map((q, i) => ({ ...q, i })).filter((q) => q.product === pid)
      const done = items.filter((q) => q.i < idx).length
      return { pid, ratio: done / items.length, current: pid === item.product }
    })
  }, [list, idx, item.product])

  return (
    <Screen
      eyebrow={
        <div>
          <div className="flex gap-1.5" aria-hidden>
            {segments.map((s) => (
              <div key={s.pid} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={cx('h-full rounded-full transition-all duration-500', productById[s.pid as keyof typeof productById].tint.bar)}
                  style={{ width: `${Math.max(s.current ? 8 : 0, s.ratio * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ProductIcon id={item.product} size="sm" />
            <p className="text-sm font-semibold text-ink-600">
              <span className="text-ink-900">{product.name}</span> · {item.local + 1} of {item.total}
              <span className="sr-only">
                {' '}
                — question {idx + 1} of {list.length} overall
              </span>
            </p>
            <span className="ml-auto text-xs font-medium text-ink-400" aria-hidden>
              {idx + 1}/{list.length}
            </span>
          </div>
        </div>
      }
      title={item.step.title}
      subtitle={item.step.subtitle}
      aside={<BundleSummary />}
      footer={
        single && !draft[item.step.fields[0].id] ? (
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-500">
            <Lock className="h-3.5 w-3.5" aria-hidden /> No name, ID or contact details needed to get your price.
          </p>
        ) : (
          <div className="space-y-3">
            {error && <InlineError>{error}</InlineError>}
            <Button block softDisabled={!valid} onClick={submit}>
              Continue
            </Button>
          </div>
        )
      }
    >
      {prefilled && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
          <Check className="h-3.5 w-3.5" aria-hidden /> We’ve used your earlier answer — change it if you need to
        </p>
      )}
      <div className="space-y-6">
        {item.step.fields.map((f, fi) => (
          <FieldInput
            key={f.id}
            field={f}
            value={draft[f.id]}
            showLabel={item.step.fields.length > 1}
            error={touched ? errors[fi] : null}
            capRemaining={f.sumAssured && cls === 'life' ? remaining : null}
            onChange={(v) => {
              if (f.kind === 'choice') return choose(f, v)
              setError(null)
              setDraft((d) => ({ ...d, [f.id]: v }))
            }}
          />
        ))}
      </div>
      {single && error && (
        <div className="mt-4">
          <InlineError>{error}</InlineError>
        </div>
      )}
    </Screen>
  )
}

function FieldInput({
  field: f,
  value,
  onChange,
  showLabel,
  error,
  capRemaining,
}: {
  field: Field
  value: string | undefined
  onChange: (v: string) => void
  showLabel: boolean
  error: string | null
  capRemaining: number | null
}) {
  if (f.kind === 'text')
    return (
      <TextField
        label={f.label}
        value={value ?? ''}
        placeholder={f.placeholder}
        inputMode={f.inputMode}
        maxLength={f.maxLength}
        error={error}
        onChange={(e) => onChange(f.inputMode === 'numeric' ? e.target.value.replace(/\D/g, '') : e.target.value)}
      />
    )
  if (f.kind === 'select')
    return <SelectField label={f.label} value={value ?? ''} options={f.options ?? []} error={error} onChange={(e) => onChange(e.target.value)} />
  if (f.kind === 'yesno')
    return (
      <fieldset>
        <legend className={cx('mb-3 text-[16px] font-semibold leading-snug text-ink-900', !showLabel && 'sr-only')}>{f.label}</legend>
        <div className="grid grid-cols-2 gap-3">
          {['no', 'yes'].map((v) => (
            <label
              key={v}
              className={cx(
                'flex h-14 cursor-pointer items-center justify-center rounded-xl text-base font-semibold ring-1 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30',
                value === v ? 'bg-brand-50 text-brand-900 ring-2 ring-brand-600' : 'bg-white text-ink-800 ring-ink-200 hover:ring-ink-300',
              )}
            >
              <input type="radio" className="sr-only" name={f.id} checked={value === v} onChange={() => onChange(v)} />
              {v === 'yes' ? 'Yes' : 'No'}
            </label>
          ))}
        </div>
      </fieldset>
    )

  const capped = (f.options ?? []).some((o) => capRemaining !== null && Number(o.value) > capRemaining)
  return (
    <fieldset>
      <legend className={cx('mb-3 text-[16px] font-semibold text-ink-900', !showLabel && 'sr-only')}>{f.label}</legend>
      <div className={cx('grid gap-3', (f.options?.length ?? 0) > 4 && !f.options?.some((o) => o.hint) ? 'grid-cols-2' : 'grid-cols-1')}>
        {f.options?.map((o, i) => {
          const disabled = capRemaining !== null && Number(o.value) > capRemaining
          const on = value === o.value
          return (
            <label
              key={o.value}
              className={cx(
                'flex min-h-[60px] items-center gap-4 rounded-2xl bg-white px-4 py-3 ring-1 transition-all animate-fade-up has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30',
                disabled ? 'cursor-not-allowed opacity-45 ring-ink-100' : 'cursor-pointer',
                !disabled && (on ? 'bg-brand-50/60 shadow-card ring-2 ring-brand-600' : 'ring-ink-200 hover:ring-ink-300'),
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <input
                type="radio"
                className="sr-only"
                name={f.id}
                checked={on}
                disabled={disabled}
                onChange={() => onChange(o.value)}
                // Re-tapping an already-selected (e.g. pre-filled) answer should still move on.
                onClick={() => on && onChange(o.value)}
              />
              <span className="flex-1">
                <span className="block text-[16px] font-semibold text-ink-900">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-sm text-ink-500">{o.hint}</span>}
              </span>
              <span
                className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset transition', on ? 'bg-brand-700 ring-brand-700' : 'bg-white ring-ink-300')}
                aria-hidden
              >
                <span className={cx('h-2 w-2 rounded-full bg-white transition', on ? 'scale-100' : 'scale-0')} />
              </span>
            </label>
          )
        })}
      </div>
      {capped && (
        <p className="mt-3 text-sm text-ink-500">
          Some amounts aren’t available because your life-type covers share a {rand(capFor('life'))} limit set by microinsurance rules. You have{' '}
          {rand(Math.max(0, capRemaining ?? 0))} left.
        </p>
      )}
    </fieldset>
  )
}
