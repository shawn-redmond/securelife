import { useState } from 'react'
import { Check, ChevronDown, CreditCard, HeartHandshake, Landmark, Lock, MessageCircle, ShieldCheck } from 'lucide-react'
import { livesCount } from '../lib/value'
import { Screen } from '../components/shell'
import { ProductIcon } from '../components/bundle'
import { Alert, Button, Checkbox, InlineError, SelectField, TextField } from '../components/ui'
import { productById } from '../data/products'
import { config } from '../config'
import { cx, rand, randShort } from '../lib/format'
import { quoteBundle } from '../lib/pricing'
import { validateBankAccount, validateCard, validateExpiry } from '../lib/validation'
import { ref, useStore } from '../state/store'

const BANKS = [
  { value: 'capitec', label: 'Capitec' },
  { value: 'fnb', label: 'FNB' },
  { value: 'absa', label: 'Absa' },
  { value: 'standard', label: 'Standard Bank' },
  { value: 'nedbank', label: 'Nedbank' },
  { value: 'tymebank', label: 'TymeBank' },
  { value: 'african', label: 'African Bank' },
  { value: 'discovery', label: 'Discovery Bank' },
]
const DAYS = ['1', '15', '20', '25', '26', 'Last day of month'].map((d) => ({ value: d, label: /^\d+$/.test(d) ? `${d}${d === '1' ? 'st' : 'th'} of the month` : d }))
const DECLINE = '4000000000000002'

const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')
const fmtExp = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function Payment() {
  const { state, set } = useStore()
  const q = quoteBundle(state.app.selected, state.app.answers, state.demo.pricingUnavailable, state.app.family)
  const [method, setMethod] = useState<'debit' | 'card'>('debit')
  const [card, setCard] = useState({ number: '', exp: '', cvv: '', name: '' })
  const [debit, setDebit] = useState({ bank: '', type: 'cheque', account: '', day: '' })
  const [confirm, setConfirm] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const existing = state.policy ? state.app.payment : null
  const childCount = state.app.members.filter((m) => m.key.startsWith('child')).length
  const withFamily = q.priced.includes('life')
  const lives = livesCount(withFamily ? state.app.family : null, childCount)
  const protectedLine =
    lives === 1 ? 'From today, you’re protected.' : `From today, ${lives ?? 'your'} ${lives ? 'people are' : 'family is'} protected.`
  const errs = existing
    ? {}
    : method === 'card'
      ? {
          number: validateCard(card.number),
          exp: validateExpiry(card.exp),
          cvv: /^\d{3,4}$/.test(card.cvv) ? null : 'Enter the 3-digit code on the back',
          name: card.name.trim().length > 1 ? null : 'Enter the name on the card',
        }
      : {
          bank: debit.bank ? null : 'Choose your bank',
          account: debit.bank ? validateBankAccount(debit.account, debit.bank) : debit.account ? null : 'Enter your account number',
          day: debit.day ? null : 'Choose a debit date',
        }
  const show = (k: string) => (submitted || touched[k] ? (errs as Record<string, string | null>)[k] : null)
  const valid = Object.values(errs).every((e) => !e) && confirm

  const activate = () => {
    setSubmitted(true)
    if (!valid) return
    setBusy(true)
    setDeclined(false)
    setTimeout(() => {
      setBusy(false)
      if (!existing && method === 'card' && card.number.replace(/\s/g, '') === DECLINE) return setDeclined(true)
      if (existing)
        return set((s) => ({ step: 'verify', app: { ...s.app, selected: q.priced, bindRef: ref('BND') } }))
      const label =
        method === 'card'
          ? `Card ending ${card.number.replace(/\s/g, '').slice(-4)}`
          : `${BANKS.find((b) => b.value === debit.bank)?.label} ···${debit.account.slice(-4)}`
      set((s) => ({
        step: 'verify',
        app: {
          ...s.app,
          selected: q.priced,
          payment: { method, label, debitDay: method === 'debit' ? debit.day : undefined },
          bindRef: ref('BND'),
        },
      }))
    }, 1600)
  }

  return (
    <Screen
      title="Activate your cover"
      subtitle={`One payment for your whole policy: ${rand(q.total)} a month.`}
      footer={
        <div className="space-y-3">
          {submitted && !confirm && <InlineError>Please confirm you’ve read the policy summary</InlineError>}
          <p className="flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-brand-800">
            <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden />
            {protectedLine}
          </p>
          <Button block softDisabled={!valid} loading={busy} onClick={activate} icon={!busy && <Lock className="h-4 w-4" aria-hidden />}>
            {busy ? 'Activating…' : 'Activate my cover'}
          </Button>
          <p className="text-center text-xs text-ink-500">Cover starts provisionally now and goes fully live once you’ve verified your ID.</p>
        </div>
      }
    >
      <ul className="-mt-2 mb-6 flex flex-wrap gap-2" aria-label="Your safety nets">
        {['Month to month', `${config.promises.coolingOffDays}-day cooling-off`, 'Cancel anytime'].map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-200">
            <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden /> {t}
          </li>
        ))}
      </ul>

      {declined && (
        <Alert tone="error" className="mb-5" title="Your payment didn’t go through.">
          Try another card, or{' '}
          <button className="font-semibold underline underline-offset-2" onClick={() => (setMethod('debit'), setDeclined(false))}>
            set up a debit order instead
          </button>
          .
        </Alert>
      )}

      {existing ? (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink-200">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-600">
            {existing.method === 'card' ? <CreditCard className="h-5 w-5" aria-hidden /> : <Landmark className="h-5 w-5" aria-hidden />}
          </span>
          <span className="flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Added to your existing debit</span>
            <span className="block font-semibold text-ink-900">{existing.label}</span>
          </span>
        </div>
      ) : (
      <>
      <div role="tablist" aria-label="Payment method" className="grid grid-cols-2 gap-1 rounded-2xl bg-ink-100 p-1">
        {(
          [
            { id: 'debit', label: 'Debit order', icon: Landmark },
            { id: 'card', label: 'Card', icon: CreditCard },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={method === t.id}
            onClick={() => (setMethod(t.id), setSubmitted(false))}
            className={cx(
              'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
              method === t.id ? 'bg-white text-ink-950 shadow-card' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            <t.icon className="h-4 w-4" aria-hidden /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-5" role="tabpanel">
        {method === 'debit' ? (
          <>
            <SelectField
              label="Bank"
              value={debit.bank}
              options={BANKS}
              error={show('bank')}
              onChange={(e) => setDebit((d) => ({ ...d, bank: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-50 p-1 text-sm">
              {['cheque', 'savings'].map((t) => (
                <label key={t} className={cx('flex h-10 cursor-pointer items-center justify-center rounded-lg font-semibold capitalize transition', debit.type === t ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500')}>
                  <input type="radio" className="sr-only" name="acctype" checked={debit.type === t} onChange={() => setDebit((d) => ({ ...d, type: t }))} />
                  {t === 'cheque' ? 'Cheque / current' : 'Savings'}
                </label>
              ))}
            </div>
            <TextField
              label="Account number"
              inputMode="numeric"
              autoComplete="off"
              value={debit.account}
              error={show('account')}
              onBlur={() => setTouched((t) => ({ ...t, account: true }))}
              onChange={(e) => setDebit((d) => ({ ...d, account: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
            />
            <SelectField label="Preferred debit date" value={debit.day} options={DAYS} error={show('day')} onChange={(e) => setDebit((d) => ({ ...d, day: e.target.value }))} />
            <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900 ring-1 ring-inset ring-sky-200">
              Your bank will send a <strong>DebiCheck</strong> request to your banking app or phone. Approve it to confirm your debit order — you stay in control.
            </p>
          </>
        ) : (
          <>
            <TextField
              label="Card number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={card.number}
              error={show('number')}
              onBlur={() => setTouched((t) => ({ ...t, number: true }))}
              onChange={(e) => setCard((c) => ({ ...c, number: fmtCard(e.target.value) }))}
              prefix={<CreditCard className="h-5 w-5" aria-hidden />}
              hint="Demo: 4242 4242 4242 4242 succeeds · 4000 0000 0000 0002 is declined"
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={card.exp}
                error={show('exp')}
                onBlur={() => setTouched((t) => ({ ...t, exp: true }))}
                onChange={(e) => setCard((c) => ({ ...c, exp: fmtExp(e.target.value) }))}
              />
              <TextField
                label="CVV"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={card.cvv}
                error={show('cvv')}
                onBlur={() => setTouched((t) => ({ ...t, cvv: true }))}
                onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              />
            </div>
            <TextField label="Name on card" autoComplete="cc-name" value={card.name} error={show('name')} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} />
          </>
        )}
      </div>

      </>
      )}

      {/* Single static disclosure — one underwriter across the whole bundle. Always visible, never behind a link. */}
      <section aria-label="Disclosure" className="mt-8 rounded-2xl bg-ink-50 p-4 text-sm leading-relaxed text-ink-700 ring-1 ring-inset ring-ink-200">
        <p className="flex items-center gap-2 font-semibold text-ink-900">
          <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden /> Who you’re dealing with
        </p>
        <p className="mt-2">
          {config.brand} is an authorised financial services provider ({config.brandFsp}). All benefits on your policy are underwritten by{' '}
          <strong>{config.underwriter.name}</strong> ({config.underwriter.fsp}). {config.underwriter.licence}.
        </p>
      </section>

      <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200">
        <button
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-ink-900 hover:bg-ink-50"
        >
          Policy summary ({q.priced.length} benefit{q.priced.length === 1 ? '' : 's'})
          <ChevronDown className={cx('h-5 w-5 text-ink-400 transition', summaryOpen && 'rotate-180')} aria-hidden />
        </button>
        {summaryOpen && (
          <div className="space-y-4 border-t border-ink-100 p-4 text-sm text-ink-700 animate-fade-up">
            {q.lines
              .filter((l) => l.result.ok)
              .map(({ id, result }) => (
                <div key={id} className="flex gap-3">
                  <ProductIcon id={id} size="sm" />
                  <div>
                    <p className="font-semibold text-ink-900">
                      {productById[id].name} · {result.ok && randShort(result.sumAssured)} · {result.ok && rand(result.monthly)}/month
                    </p>
                    <p className="text-ink-600">
                      Fixed benefit paid on a covered event. {id === 'life' ? '6-month waiting period for natural causes; accidents covered from day one.' : '3-month waiting period applies, except accidents.'}{' '}
                      No cash-back or savings component.
                    </p>
                  </div>
                </div>
              ))}
            <p className="text-ink-500">You have a 31-day cooling-off period to cancel for a full refund, provided no claim has been made.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-inset ring-brand-200">
        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        <p>
          <span className="font-semibold">If something happens, one WhatsApp is all it takes.</span> We pay valid claims within{' '}
          {config.promises.claimPayoutHours} hours. Join {config.promises.customersLabel} already covered.
        </p>
      </div>

      <div className="mt-5">
        <Checkbox checked={confirm} onChange={setConfirm}>
          I’ve read and understood the policy summary for every benefit on my policy.
        </Checkbox>
      </div>
    </Screen>
  )
}
