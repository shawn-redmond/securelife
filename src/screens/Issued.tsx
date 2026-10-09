import { useEffect, useState } from 'react'
import { CircleCheck, Download, FileText, LoaderCircle, Mail, MessageCircle, Phone, Plus, UserPlus } from 'lucide-react'
import { Screen, Sheet } from '../components/shell'
import { ProductIcon } from '../components/bundle'
import { Badge, Button, Card, SelectField, TextField } from '../components/ui'
import { notify } from '../components/Toast'
import { productById } from '../data/products'
import { config } from '../config'
import { longDate, maskPhone, rand, randShort } from '../lib/format'
import { normalisePhone } from '../lib/validation'
import { newApplication, useStore, type Policy, type State } from '../state/store'

export function Issued() {
  const { state, set } = useStore()
  const [benOpen, setBenOpen] = useState(false)
  const total = state.held.reduce((s, p) => s + p.monthly, 0)
  const retrying = state.held.some((p) => p.docs === 'retrying')

  // A failed document is retried on its own — it never blocks the rest of the bundle.
  useEffect(() => {
    if (!retrying) return
    const t = setTimeout(() => {
      set((s) => ({ held: s.held.map((p) => (p.docs === 'retrying' ? { ...p, docs: 'sent' } : p)), demo: { ...s.demo, docFailure: false } }))
      notify(`Email to ${state.customer.email}`, 'The last of your policy documents is attached.')
    }, 6000)
    return () => clearTimeout(t)
  }, [retrying, set, state.customer.email])

  useEffect(() => {
    notify(`Email to ${state.customer.email}`, `Welcome to ${config.brand}! Your policy documents are attached.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const firstDebit = state.app.payment?.debitDay
  const addMore = () => set((s) => ({ step: 'pick', app: { ...newApplication(), skippedRecommender: true, payment: s.app.payment } }))

  return (
    <Screen
      wide
      eyebrow={
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lift animate-pop">
          <CircleCheck className="h-9 w-9" aria-hidden />
        </span>
      }
      title="You’re covered"
      subtitle={`Your documents are on their way to ${state.customer.email}. Cover started today, ${longDate(new Date())}.`}
      footer={
        <div className="grid gap-3 sm:grid-cols-2">
          <Button block onClick={() => downloadPolicy(state)} icon={<Download className="h-5 w-5" aria-hidden />}>
            Download my policy
          </Button>
          <Button block variant="secondary" onClick={() => setBenOpen(true)} icon={<UserPlus className="h-5 w-5" aria-hidden />}>
            Add a beneficiary
          </Button>
        </div>
      }
    >
      <Card className="divide-y divide-ink-100">
        {state.held.map((p) => (
          <div key={p.number} className="flex items-center gap-4 p-4 sm:p-5">
            <ProductIcon id={p.product} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink-950">{productById[p.product].name}</p>
              <p className="text-sm text-ink-500">
                {p.number} · {randShort(p.sumAssured)} benefit
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums text-ink-900">{rand(p.monthly)}</p>
              {p.docs === 'sent' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                  <Mail className="h-3.5 w-3.5" aria-hidden /> Docs sent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> Sending separately
                </span>
              )}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4 bg-ink-50/60 p-4 text-sm sm:grid-cols-3 sm:p-5">
          <Stat label="Monthly total" value={rand(total)} />
          <Stat label="Paying by" value={state.app.payment?.label ?? 'On file'} />
          <Stat label="First debit" value={firstDebit ? (/^\d+$/.test(firstDebit) ? `${firstDebit} ${new Date().toLocaleString('en-ZA', { month: 'long' })}` : firstDebit) : 'Today'} />
        </div>
      </Card>

      {retrying && (
        <p className="mt-3 text-sm text-ink-600">
          One document is taking a little longer. We’ll email it separately — the rest of your cover is already active.
        </p>
      )}

      {state.beneficiaries.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-500">Beneficiaries</h2>
          <ul className="mt-2 space-y-2">
            {state.beneficiaries.map((b) => (
              <li key={b.name + b.phone} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm ring-1 ring-ink-100">
                <span className="font-semibold text-ink-900">{b.name}</span>
                <span className="text-ink-500">
                  {b.relationship} · {b.share}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-100">
          <p className="flex items-center gap-2 font-semibold text-ink-950">
            <FileText className="h-5 w-5 text-brand-600" aria-hidden /> How to claim
          </p>
          <p className="mt-1 text-sm text-ink-500">The claims process differs slightly by product:</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            {state.held.map((p) => (
              <li key={p.number}>
                <span className="font-semibold">{productById[p.product].short}:</span> {productById[p.product].claimsNote}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-100">
          <p className="font-semibold text-ink-950">Need help?</p>
          <p className="mt-1 text-sm text-ink-500">Real people, 7 days a week.</p>
          <div className="mt-3 space-y-2 text-sm">
            <a href={config.support.whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-brand-700 hover:underline">
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp {config.support.whatsapp}
            </a>
            <a href={`tel:${config.support.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 font-semibold text-brand-700 hover:underline">
              <Phone className="h-4 w-4" aria-hidden /> Call {config.support.phone}
            </a>
          </div>
          <button onClick={addMore} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-brand-700">
            <Plus className="h-4 w-4" aria-hidden /> Add more cover — no new ID check
          </button>
        </div>
      </div>

      <BeneficiarySheet open={benOpen} onClose={() => setBenOpen(false)} />
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-0.5 font-semibold text-ink-950">{value}</p>
    </div>
  )
}

function BeneficiarySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, set } = useStore()
  const [f, setF] = useState({ name: '', relationship: '', phone: '' })
  const [touched, setTouched] = useState(false)
  const used = state.beneficiaries.reduce((s, b) => s + b.share, 0)
  const errs = {
    name: f.name.trim().split(/\s+/).length >= 2 ? null : 'Enter their first name and surname',
    relationship: f.relationship ? null : 'Choose a relationship',
    phone: normalisePhone(f.phone) ? null : 'Enter a valid South African cell number',
  }
  const save = () => {
    setTouched(true)
    if (Object.values(errs).some(Boolean)) return
    set((s) => {
      const list = [...s.beneficiaries, { name: f.name.trim(), relationship: f.relationship, phone: normalisePhone(f.phone)!, share: 0 }]
      const even = Math.floor(100 / list.length)
      return { beneficiaries: list.map((b, i) => ({ ...b, share: i === 0 ? 100 - even * (list.length - 1) : even })) }
    })
    notify(`SMS to ${maskPhone(f.phone)}`, `${f.name.split(' ')[0]}, you've been named as a beneficiary on a ${config.brand} policy.`)
    setF({ name: '', relationship: '', phone: '' })
    setTouched(false)
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Add a beneficiary">
      <p className="-mt-2 mb-5 text-sm text-ink-600">
        This person receives the payout from your life-type covers. {used > 0 && 'Payouts are split evenly — you can change shares later.'}
      </p>
      <div className="space-y-4">
        <TextField label="Full name" value={f.name} error={touched ? errs.name : null} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <SelectField
          label="Relationship"
          value={f.relationship}
          error={touched ? errs.relationship : null}
          options={['Spouse or partner', 'Child', 'Parent', 'Sibling', 'Other family', 'Other'].map((v) => ({ value: v, label: v }))}
          onChange={(e) => setF({ ...f, relationship: e.target.value })}
        />
        <TextField label="Their cell number" type="tel" inputMode="tel" value={f.phone} error={touched ? errs.phone : null} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <Button block onClick={save}>
          Save beneficiary
        </Button>
      </div>
      {state.beneficiaries.length > 0 && (
        <p className="mt-4 text-center text-xs text-ink-500">
          <Badge tone="ink">{state.beneficiaries.length} saved</Badge>
        </p>
      )}
    </Sheet>
  )
}

function downloadPolicy(state: State) {
  const rows = state.held
    .map(
      (p: Policy) =>
        `<tr><td>${productById[p.product].name}</td><td>${p.number}</td><td>R${p.sumAssured.toLocaleString('en-ZA')}</td><td>R${p.monthly}</td><td>${longDate(new Date(p.startDate))}</td></tr>`,
    )
    .join('')
  const total = state.held.reduce((s, p) => s + p.monthly, 0)
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${config.brand} – Policy schedule</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1a1e2b}h1{color:#04755c}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb}th{background:#f6f7f9;font-size:13px;text-transform:uppercase;letter-spacing:.04em}small{color:#667391}</style></head>
<body><h1>${config.brand} – Policy schedule</h1><p>Policyholder contact: ${maskPhone(state.customer.phone)} · ${state.customer.email}<br/>Identity verified: Yes (FICA)</p>
<table><thead><tr><th>Cover</th><th>Policy no.</th><th>Fixed benefit</th><th>Monthly</th><th>Start date</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><th colspan="3">Total monthly premium</th><th colspan="2">R${total}</th></tr></tfoot></table>
<p><small>${config.brand} is an authorised FSP (${config.brandFsp}). Underwritten by ${config.underwriter.name} (${config.underwriter.fsp}). Benefits are fixed amounts payable on a covered event; no investment or cash-back component. PROTOTYPE DOCUMENT – NOT A REAL POLICY.</small></p></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'SecureLife-policy-schedule.html'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  notify(`Email to ${state.customer.email}`, 'A copy of your policy schedule is attached.')
}
