import { useState } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { Sheet } from './shell'
import { PRODUCTS } from '../data/products'
import { cx } from '../lib/format'
import { STEP_NUMBER, useStore, type KycTrigger, type StepId, type VerifyOutcome } from '../state/store'

const STEP_LABEL: Record<StepId, string> = {
  engage: 'Engage',
  recommend: 'Bundle recommender',
  pick: 'Bundle picker',
  questions: 'Per-product questions',
  quote: 'Bundle quote',
  contact: 'Contact capture',
  payment: 'Payment & bind',
  verify: 'Identity verification',
  issued: 'Policy issued',
  kyc: 'Progressive KYC',
}

/**
 * Presenter-only controls to demonstrate the edge states in the spec without a backend.
 * Not part of the customer journey.
 */
export function DemoPanel() {
  const { state, set, reset } = useStore()
  const [open, setOpen] = useState(false)
  const d = state.demo
  const patchDemo = (p: Partial<typeof d>) => set((s) => ({ demo: { ...s.demo, ...p } }))

  const trigger = (type: KycTrigger) => {
    if (!state.held.length) return
    set((s) => ({ step: 'kyc', kycTrigger: { type, product: s.held[0].product }, kycDone: false }))
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink-950 px-3 text-xs font-semibold text-white transition hover:bg-ink-800"
      >
        <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Demo
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Demo controls">
        <p className="-mt-2 mb-5 text-sm text-ink-600">Simulate the edge states from the spec. Current screen: step {STEP_NUMBER[state.step]} – {STEP_LABEL[state.step]}.</p>

        <Group title="Step 4–5 · Pricing engine can’t price">
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map((p) => (
              <Chip
                key={p.id}
                on={d.pricingUnavailable.includes(p.id)}
                onClick={() =>
                  patchDemo({
                    pricingUnavailable: d.pricingUnavailable.includes(p.id) ? d.pricingUnavailable.filter((x) => x !== p.id) : [...d.pricingUnavailable, p.id],
                  })
                }
              >
                {p.short}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-500">Also natural: motor older than 20 years, or “yes” to the critical-illness history question.</p>
        </Group>

        <Group title="Step 6 · OTP">
          <Chip on={d.otpExpired} onClick={() => patchDemo({ otpExpired: !d.otpExpired })}>
            Expire the current PIN
          </Chip>
        </Group>

        <Group title="Step 7 · Payment">
          <p className="text-xs text-ink-500">Use card 4000 0000 0000 0002 to see a decline.</p>
        </Group>

        <Group title="Step 8 · Next verification result">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['success', 'Success'],
                ['no-face', 'Poor lighting (once)'],
                ['liveness-fail', 'Liveness fails'],
                ['id-mismatch', 'ID mismatch'],
              ] as [VerifyOutcome, string][]
            ).map(([v, l]) => (
              <Chip key={v} on={d.verifyOutcome === v} onClick={() => patchDemo({ verifyOutcome: v })}>
                {l}
              </Chip>
            ))}
          </div>
        </Group>

        <Group title="Step 9 · Documents">
          <Chip on={d.docFailure} onClick={() => patchDemo({ docFailure: !d.docFailure })}>
            One product’s document fails first time
          </Chip>
        </Group>

        <Group title="Step 10 · Trigger progressive KYC">
          {state.held.length ? (
            <div className="flex flex-wrap gap-2">
              <Chip onClick={() => trigger('early-claim')}>Early claim</Chip>
              <Chip onClick={() => trigger('pep')}>PEP / sanctions match</Chip>
              <Chip onClick={() => trigger('beneficiary')}>Beneficiary change</Chip>
              <Chip onClick={() => trigger('payout')}>Unusual payouts</Chip>
              <Chip on={d.uploadFail} onClick={() => patchDemo({ uploadFail: !d.uploadFail })}>
                Next upload fails
              </Chip>
            </div>
          ) : (
            <p className="text-xs text-ink-500">Available once a policy has been issued.</p>
          )}
        </Group>

        <button
          onClick={() => {
            reset()
            setOpen(false)
          }}
          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:underline"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset journey and clear saved data
        </button>
      </Sheet>
    </>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 border-b border-ink-100 pb-5 last:border-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-500">{title}</p>
      {children}
    </div>
  )
}

function Chip({ on, onClick, children }: { on?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        'rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition',
        on ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-ink-700 ring-ink-200 hover:ring-ink-300',
      )}
    >
      {children}
    </button>
  )
}
