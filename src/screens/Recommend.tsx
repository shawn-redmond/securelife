import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { BotBubble, Screen } from '../components/shell'
import { Button, InlineError, LinkButton } from '../components/ui'
import { PROFILE_QUESTIONS, type Profile } from '../data/plans'
import { cx } from '../lib/format'
import { useStore } from '../state/store'

const AGE_BANDS = ['18-29', '30-39', '40-49', '50-59', '60-65']

export function Recommend() {
  const { state, set } = useStore()
  const { rIndex, profile } = state.app
  const q = PROFILE_QUESTIONS[Math.min(rIndex, PROFILE_QUESTIONS.length - 1)]
  const [error, setError] = useState<string | null>(null)
  const advancing = useRef(false)

  const next = (patch: Partial<Profile>) => {
    if (advancing.current) return
    advancing.current = true
    setTimeout(() => {
      set((s) => {
        const profile = { ...s.app.profile, ...patch }
        const last = s.app.rIndex >= PROFILE_QUESTIONS.length - 1
        return last ? { step: 'plans', app: { ...s.app, profile } } : { app: { ...s.app, profile, rIndex: s.app.rIndex + 1 } }
      })
      advancing.current = false
    }, 220)
  }

  const buildOwn = () =>
    set((s) => ({ step: 'pick', app: { ...s.app, skippedRecommender: true, plan: null, onlySteps: null, selected: [], qIndex: 0 } }))

  const value = q.id === 'about' ? undefined : (profile[q.id] as string | undefined)

  return (
    <Screen
      key={q.id}
      eyebrow={
        <div className="space-y-5">
          {rIndex === 0 && (
            <BotBubble>Hi there 👋 Answer 5 quick questions and I’ll show you three ready-made plans, with prices. No ID or contact details needed.</BotBubble>
          )}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1.5" aria-hidden>
              {PROFILE_QUESTIONS.map((pq, i) => (
                <div key={pq.id} className={cx('h-1.5 flex-1 rounded-full transition-colors', i <= rIndex ? 'bg-brand-500' : 'bg-ink-100')} />
              ))}
            </div>
            <span className="text-xs font-semibold text-ink-500">
              {rIndex + 1} of {PROFILE_QUESTIONS.length}
            </span>
          </div>
        </div>
      }
      title={q.title}
      subtitle={q.subtitle}
      footer={
        q.id === 'about' ? (
          <div className="space-y-3">
            {error && <InlineError>{error}</InlineError>}
            <Button
              block
              softDisabled={!profile.ageBand || !profile.smoker}
              onClick={() => {
                if (!profile.ageBand) return setError('Choose your age range')
                if (!profile.smoker) return setError('Tell us if you smoke')
                next({})
              }}
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="text-center">
            {value && (
              <Button block className="mb-3" onClick={() => next({})}>
                Continue
              </Button>
            )}
            <LinkButton onClick={buildOwn} className="text-[15px]">
              I know what I want — build my own instead
            </LinkButton>
          </div>
        )
      }
    >
      {q.id === 'about' ? (
        <div className="space-y-7">
          <fieldset>
            <legend className="mb-3 text-[16px] font-semibold text-ink-900">Your age range</legend>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {AGE_BANDS.map((b) => (
                <Pill
                  key={b}
                  name="age"
                  on={profile.ageBand === b}
                  onSelect={() => (setError(null), set((s) => ({ app: { ...s.app, profile: { ...s.app.profile, ageBand: b } } })))}
                >
                  {b.replace('-', ' – ')}
                </Pill>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-[16px] font-semibold text-ink-900">Have you smoked in the last 12 months?</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {(['no', 'yes'] as const).map((v) => (
                <Pill
                  key={v}
                  name="smoker"
                  on={profile.smoker === v}
                  onSelect={() => (setError(null), set((s) => ({ app: { ...s.app, profile: { ...s.app.profile, smoker: v } } })))}
                >
                  {v === 'yes' ? 'Yes' : 'No'}
                </Pill>
              ))}
            </div>
          </fieldset>
        </div>
      ) : (
        <fieldset>
          <legend className="sr-only">{q.title}</legend>
          <div className="space-y-3">
            {q.options!.map((o, i) => {
              const on = value === o.value
              return (
                <label
                  key={o.value}
                  className={cx(
                    'flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 ring-1 transition-all animate-fade-up has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30',
                    on ? 'shadow-card ring-2 ring-brand-600' : 'ring-ink-200 hover:ring-ink-300',
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    className="sr-only"
                    checked={on}
                    onChange={() => next({ [q.id]: o.value })}
                    onClick={() => on && next({})}
                  />
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-50 text-2xl" aria-hidden>
                    {o.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[16px] font-semibold text-ink-900">{o.label}</span>
                    {o.hint && <span className="block text-sm text-ink-500">{o.hint}</span>}
                  </span>
                  <span
                    className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset transition', on ? 'bg-brand-700 ring-brand-700' : 'bg-white ring-ink-300')}
                    aria-hidden
                  >
                    <Check className={cx('h-4 w-4 text-white transition', on ? 'scale-100' : 'scale-0')} strokeWidth={3} />
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
    </Screen>
  )
}

function Pill({ on, onSelect, name, children }: { on: boolean; onSelect: () => void; name: string; children: React.ReactNode }) {
  return (
    <label
      className={cx(
        'flex h-14 cursor-pointer items-center justify-center rounded-xl text-[15px] font-semibold ring-1 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30',
        on ? 'bg-brand-50 text-brand-900 ring-2 ring-brand-600' : 'bg-white text-ink-800 ring-ink-200 hover:ring-ink-300',
      )}
    >
      <input type="radio" name={name} className="sr-only" checked={on} onChange={onSelect} />
      {children}
    </label>
  )
}
