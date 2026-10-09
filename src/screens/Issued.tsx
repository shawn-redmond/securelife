import { useEffect, useState } from 'react'
import { Check, CircleCheck, Copy, Download, FileText, HeartHandshake, LoaderCircle, Mail, MessageCircle, Phone, Plus, UserPlus } from 'lucide-react'
import { Screen, Sheet } from '../components/shell'
import { ProductIcon } from '../components/bundle'
import { Badge, Button, Card, SelectField, TextField } from '../components/ui'
import { notify } from '../components/Toast'
import { productById } from '../data/products'
import { config } from '../config'
import { longDate, maskPhone, rand, randShort } from '../lib/format'
import { normalisePhone } from '../lib/validation'
import { newApplication, useStore, type Policy, type State } from '../state/store'
import { childAmount, familyCount } from '../data/family'

export function Issued() {
  const { state, set } = useStore()
  const [benOpen, setBenOpen] = useState(false)
  const policy = state.policy!
  const total = policy.benefits.reduce((s, b) => s + b.monthly, 0) + policy.familyMonthly
  const retrying = policy.docs === 'retrying'
  const updated = policy.version > 1
  const lives = livesCovered(policy)
  const name = state.customer.firstName
  const hasFamily = lives.length > 1
  const headline = updated
    ? `${name ? `${name}, your` : 'Your'} policy is updated`
    : hasFamily
      ? `${name ? `${name}, your` : 'Your'} family is covered`
      : `${name ? `${name}, you’re` : 'You’re'} covered`
  const shareText =
    `Hi, it's ${name || 'me'}. I've taken out cover with ${config.brand}` +
    (hasFamily ? ' that includes funeral cover for you too.' : '.') +
    ` If anything ever happens, WhatsApp ${config.brand} on ${config.support.whatsapp} and quote policy ${policy.number}.` +
    ` They pay valid claims within ${config.promises.claimPayoutHours} hours. Please save this message.`

  // One document for the whole policy; if it fails it is retried and sent as soon as it's ready.
  useEffect(() => {
    if (!retrying) return
    const t = setTimeout(() => {
      set((s) => ({ policy: s.policy && { ...s.policy, docs: 'sent' }, demo: { ...s.demo, docFailure: false } }))
      notify(`Email to ${state.customer.email}`, `Your policy document for ${policy.number} is attached.`)
    }, 6000)
    return () => clearTimeout(t)
  }, [retrying, set, state.customer.email, policy.number])

  useEffect(() => {
    if (!retrying)
      notify(
        `Email to ${state.customer.email}`,
        updated ? `Your updated policy ${policy.number} (version ${policy.version}) is attached.` : `Welcome to ${config.brand}! Your policy ${policy.number} is attached.`,
      )
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
      title={headline}
      subtitle={
        updated
          ? `We’ve added the new benefits to your policy. The updated policy document is on its way to ${state.customer.email}.`
          : `Your policy document is on its way to ${state.customer.email}. Cover started today, ${longDate(new Date(policy.startDate))}.`
      }
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
      <Card>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink-100 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Policy number</p>
            <p className="font-display text-xl font-extrabold tracking-tight text-ink-950">{policy.number}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {updated && <Badge tone="ink">Version {policy.version}</Badge>}
            {retrying ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> Document on its way
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                <Mail className="h-3.5 w-3.5" aria-hidden /> Policy document sent
              </span>
            )}
          </div>
        </div>

        <p className="px-4 pt-4 text-xs font-bold uppercase tracking-wider text-ink-500 sm:px-5">
          {policy.benefits.length} benefit{policy.benefits.length === 1 ? '' : 's'}
        </p>
        <ul className="divide-y divide-ink-100">
          {policy.benefits.map((b) => {
            const isNew = updated && b.addedOn !== policy.startDate && b.addedOn === latestAdd(policy)
            const monthly = b.product === 'life' ? b.monthly + policy.familyMonthly : b.monthly
            return (
              <li key={b.product} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                <ProductIcon id={b.product} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-950">
                    {productById[b.product].name} {isNew && <Badge>New</Badge>}
                  </p>
                  <p className="text-sm text-ink-500">
                    {randShort(b.sumAssured)} benefit
                    {b.product === 'life' && familyCount(policy.family) > 0 && ` · plus ${familyCount(policy.family)} family`}
                  </p>
                </div>
                <p className="font-semibold tabular-nums text-ink-900">{rand(monthly)}</p>
              </li>
            )
          })}
        </ul>
        <div className="grid grid-cols-2 gap-4 border-t border-ink-100 bg-ink-50/60 p-4 text-sm sm:grid-cols-3 sm:p-5">
          <Stat label="Monthly total" value={rand(total)} />
          <Stat label="Paying by" value={state.app.payment?.label ?? 'On file'} />
          <Stat label="First debit" value={firstDebit ? (/^\d+$/.test(firstDebit) ? `${firstDebit} ${new Date().toLocaleString('en-ZA', { month: 'long' })}` : firstDebit) : 'Today'} />
        </div>
      </Card>

      {retrying && <p className="mt-3 text-sm text-ink-600">Your policy document is taking a little longer. Your cover is already active and we’ll email it shortly.</p>}

      {lives.length > 1 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-500">Who’s covered for funerals</h2>
          <ul className="mt-2 divide-y divide-ink-100 rounded-2xl bg-white ring-1 ring-ink-100">
            {lives.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-ink-900">{l.name}</span>
                  <span className="text-ink-500"> · {l.relation}</span>
                </span>
                <span className="shrink-0 tabular-nums text-ink-700">{rand(l.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-ink-100">
        <p className="flex items-center gap-2 font-semibold text-ink-950">
          <HeartHandshake className="h-5 w-5 text-brand-600" aria-hidden /> Let your family know they’re covered
        </p>
        <p className="mt-1 text-sm text-ink-600">The people you love should know who to call. Send them this on WhatsApp:</p>
        <blockquote className="mt-3 rounded-xl rounded-tl-sm bg-[#e7f7ef] p-3 text-sm leading-relaxed text-ink-800">{shareText}</blockquote>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1fa855] px-4 text-sm font-semibold text-white transition hover:bg-[#178a45]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Share on WhatsApp
          </a>
          <CopyButton text={shareText} />
        </div>
      </section>

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
          <p className="mt-1 text-sm text-ink-500">Quote your policy number. What we need depends on the benefit:</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            {policy.benefits.map((b) => (
              <li key={b.product}>
                <span className="font-semibold">{productById[b.product].short}:</span> {productById[b.product].claimsNote}
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
            <p className="flex items-center gap-2 font-semibold text-ink-700">
              <Phone className="h-4 w-4 text-brand-700" aria-hidden /> Call {config.support.phone}
            </p>
          </div>
          {policy.benefits.length < 5 && (
            <button onClick={addMore} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-brand-700">
              <Plus className="h-4 w-4" aria-hidden /> Add a benefit to this policy
            </button>
          )}
        </div>
      </div>

      <BeneficiarySheet open={benOpen} onClose={() => setBenOpen(false)} />
    </Screen>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size="md"
      variant="secondary"
      onClick={() =>
        navigator.clipboard
          ?.writeText(text)
          .then(() => setCopied(true))
          .catch(() => setCopied(false))
      }
      icon={copied ? <Check className="h-4 w-4 text-brand-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
    >
      {copied ? 'Copied' : 'Copy message'}
    </Button>
  )
}

const latestAdd = (p: Policy) => p.benefits.reduce((m, b) => (b.addedOn > m ? b.addedOn : m), '')

/** Everyone with a funeral benefit on the policy: the policyholder first, then family members. */
function livesCovered(p: Policy) {
  const life = p.benefits.find((b) => b.product === 'life')
  if (!life) return []
  const out = [{ key: 'you', name: 'You', relation: 'Policyholder', amount: life.sumAssured }]
  for (const m of p.members) {
    const age = ageFromDob(m.dob)
    const amount = m.key.startsWith('child') && age !== null ? childAmount(p.family?.amount ?? 0, age) : (p.family?.amount ?? 0)
    out.push({ key: m.key, name: m.name, relation: m.relation, amount })
  }
  return out
}

function ageFromDob(dob: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob)
  if (!m) return null
  const b = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  const now = new Date()
  let a = now.getFullYear() - b.getFullYear()
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) a--
  return a
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
  const p = state.policy!
  const rows = p.benefits
    .map((b) => `<tr><td>${productById[b.product].name}</td><td>R${b.sumAssured.toLocaleString('en-ZA')}</td><td>R${b.monthly}</td><td>${longDate(new Date(b.addedOn))}</td></tr>`)
    .join('')
  const lives = livesCovered(p)
    .map((l) => `<tr><td>${l.name}</td><td>${l.relation}</td><td>R${l.amount.toLocaleString('en-ZA')}</td></tr>`)
    .join('')
  const famRow = p.familyMonthly ? `<tr><td>Family funeral cover (${familyCount(p.family)} lives)</td><td>See lives covered</td><td>R${p.familyMonthly}</td><td></td></tr>` : ''
  const total = p.benefits.reduce((s, b) => s + b.monthly, 0) + p.familyMonthly
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${config.brand} – Policy ${p.number}</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1a1e2b}h1{color:#04755c;margin-bottom:4px}h2{margin-top:32px;font-size:16px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb}th{background:#f6f7f9;font-size:13px;text-transform:uppercase;letter-spacing:.04em}small{color:#667391}</style></head>
<body><h1>${config.brand} policy schedule</h1><p><strong>Policy number ${p.number}</strong> · version ${p.version} · started ${longDate(new Date(p.startDate))}<br/>Policyholder contact: ${maskPhone(state.customer.phone)} · ${state.customer.email} · Identity verified (FICA)</p>
<h2>Benefits</h2><table><thead><tr><th>Benefit</th><th>Fixed amount</th><th>Monthly</th><th>Added</th></tr></thead><tbody>${rows}${famRow}</tbody>
<tfoot><tr><th colspan="2">Total monthly premium</th><th colspan="2">R${total}</th></tr></tfoot></table>
${lives ? `<h2>Lives covered for funerals</h2><table><thead><tr><th>Name</th><th>Relationship</th><th>Funeral payout</th></tr></thead><tbody>${lives}</tbody></table>` : ''}
<p><small>${config.brand} is an authorised FSP (${config.brandFsp}). Underwritten by ${config.underwriter.name} (${config.underwriter.fsp}). Benefits are fixed amounts payable on a covered event; no investment or cash-back component. PROTOTYPE DOCUMENT – NOT A REAL POLICY.</small></p></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `SecureLife-policy-${p.number}.html`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  notify(`Email to ${state.customer.email}`, `A copy of policy ${p.number} is attached.`)
}
