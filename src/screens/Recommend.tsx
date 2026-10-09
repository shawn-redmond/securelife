import { useState } from 'react'
import { Check } from 'lucide-react'
import { BotBubble, Screen } from '../components/shell'
import { Button, InlineError, LinkButton } from '../components/ui'
import { SITUATIONS, recommend, type SituationId } from '../data/recommender'
import { cx } from '../lib/format'
import { useStore } from '../state/store'

export function Recommend() {
  const { state, set } = useStore()
  const [picked, setPicked] = useState<SituationId[]>(state.app.situations)
  const [error, setError] = useState(false)

  const toggle = (id: SituationId) => {
    setError(false)
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const submit = () => {
    if (!picked.length) return setError(true)
    const { products, bundle } = recommend(picked)
    set((s) => ({
      step: 'pick',
      app: { ...s.app, situations: picked, skippedRecommender: false, recommended: products, bundleName: bundle?.name ?? null, selected: products, qIndex: 0 },
    }))
  }

  const skip = () =>
    set((s) => ({ step: 'pick', app: { ...s.app, situations: [], skippedRecommender: true, recommended: [], bundleName: null, selected: [], qIndex: 0 } }))

  return (
    <Screen
      eyebrow={<BotBubble>Hi there 👋 I’ll help you put together the right cover. It takes about 2 minutes — no ID or contact details needed yet.</BotBubble>}
      title="Not sure what to bundle? Tell us a bit about your situation."
      subtitle="Tick everything that applies."
      footer={
        <div className="space-y-3">
          {error && <InlineError>Select at least one, or skip to build your own</InlineError>}
          <Button block softDisabled={!picked.length} onClick={submit}>
            Show my recommended bundle
          </Button>
          <div className="text-center">
            <LinkButton onClick={skip} className="text-[15px]">
              I know what I want — build my own instead
            </LinkButton>
          </div>
        </div>
      }
    >
      <fieldset>
        <legend className="sr-only">Your situation</legend>
        <div className="space-y-3">
          {SITUATIONS.map((s, i) => {
            const on = picked.includes(s.id)
            return (
              <label
                key={s.id}
                className={cx(
                  'group flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 ring-1 transition-all animate-fade-up has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30',
                  on ? 'shadow-card ring-2 ring-brand-600' : 'ring-ink-200 hover:ring-ink-300',
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(s.id)} />
                <span className="text-2xl" aria-hidden>
                  {s.emoji}
                </span>
                <span className="flex-1 text-[16px] font-semibold leading-snug text-ink-900">{s.label}</span>
                <span
                  className={cx(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ring-inset transition',
                    on ? 'bg-brand-700 ring-brand-700' : 'bg-white ring-ink-300',
                  )}
                  aria-hidden
                >
                  <Check className={cx('h-4 w-4 text-white transition', on ? 'scale-100' : 'scale-0')} strokeWidth={3} />
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </Screen>
  )
}
