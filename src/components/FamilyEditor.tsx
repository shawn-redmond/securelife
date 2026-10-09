import { useState } from 'react'
import { Minus, Plus, Users } from 'lucide-react'
import { Sheet } from './shell'
import { Badge, Button } from './ui'
import {
  CHILD_LIMITS,
  FAMILY_AMOUNTS,
  FAMILY_BANDS,
  MAX_EXTENDED,
  MAX_PARENTS,
  emptyFamily,
  familyCount,
  familyLines,
  familyPremium,
  type FamilyBand,
  type FamilyCover,
} from '../data/family'
import type { Dependant } from '../data/plans'
import { cx, rand } from '../lib/format'
import { familyWaitingText } from '../lib/value'

const R = (n: number) => `R${n.toLocaleString('en-ZA')}`

/** Summary card plus editor sheet for extended-family funeral lives. */
export function FamilyPanel({
  family,
  onChange,
  reliesOnYou = [],
  className,
}: {
  family: FamilyCover | null
  onChange: (f: FamilyCover | null) => void
  reliesOnYou?: Dependant[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const n = familyCount(family)
  return (
    <section aria-labelledby="family-cover" className={cx('rounded-2xl bg-white p-4 ring-1 ring-ink-200 sm:p-5', className)}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
          <Users className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="family-cover" className="font-semibold text-ink-950">
            {n ? 'Family funeral cover' : 'Cover your family’s funerals too'}
          </h2>
          <p className="text-sm text-ink-600">
            {n
              ? `${n === 1 ? '1 family member' : `${n} family members`} · ${R(family!.amount)} each · +${rand(familyPremium(family))}/mo`
              : 'Add your partner, children, parents or extended family. Each person gets their own funeral payout.'}
          </p>
        </div>
        <Button size="sm" variant={n ? 'secondary' : 'primary'} onClick={() => setOpen(true)} icon={!n && <Plus className="h-4 w-4" aria-hidden />}>
          {n ? 'Edit' : 'Add'}
        </Button>
      </div>
      <FamilySheet open={open} onClose={() => setOpen(false)} initial={family} reliesOnYou={reliesOnYou} onSave={(f) => (onChange(familyCount(f) ? f : null), setOpen(false))} />
    </section>
  )
}

function FamilySheet({
  open,
  onClose,
  initial,
  onSave,
  reliesOnYou,
}: {
  open: boolean
  onClose: () => void
  initial: FamilyCover | null
  onSave: (f: FamilyCover) => void
  reliesOnYou: Dependant[]
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Family funeral cover">
      {open && <Editor initial={initial} onSave={onSave} reliesOnYou={reliesOnYou} />}
    </Sheet>
  )
}

function Editor({ initial, onSave, reliesOnYou }: { initial: FamilyCover | null; onSave: (f: FamilyCover) => void; reliesOnYou: Dependant[] }) {
  const [f, setF] = useState<FamilyCover>(initial ?? emptyFamily())
  const price = (key: string) => familyLines(f).find((l) => l.key === key)?.monthly
  const total = familyPremium(f)
  const relies = (d: Dependant) => reliesOnYou.includes(d) && <Badge>Relies on you</Badge>

  const setBand = (list: 'parents' | 'extended', i: number, b: FamilyBand) =>
    setF((x) => ({ ...x, [list]: x[list].map((v, j) => (j === i ? b : v)) }))

  return (
    <div className="-mt-2 space-y-6">
      <p className="text-sm text-ink-600">Each person is covered separately. We’ll ask for their names after you’ve seen your price.</p>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-800">Funeral payout per adult</legend>
        <div className="grid grid-cols-3 gap-2">
          {FAMILY_AMOUNTS.map((a) => (
            <label
              key={a}
              className={cx(
                'flex h-12 cursor-pointer items-center justify-center rounded-xl text-[15px] font-semibold ring-1 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/30',
                f.amount === a ? 'bg-brand-50 text-brand-900 ring-2 ring-brand-600' : 'bg-white text-ink-800 ring-ink-200',
              )}
            >
              <input type="radio" name="famamt" className="sr-only" checked={f.amount === a} onChange={() => setF((x) => ({ ...x, amount: a }))} />
              {R(a)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="divide-y divide-ink-100 rounded-2xl ring-1 ring-ink-200">
        <Row title="Partner" extra={relies('partner')} price={f.partner ? price('partner') : undefined}>
          <Switch label="Cover my partner" on={f.partner} onChange={(v) => setF((x) => ({ ...x, partner: v }))} />
        </Row>
        <Row
          title="Children under 21"
          sub="All your children for one price"
          extra={relies('children')}
          price={f.children ? price('children') : undefined}
        >
          <Switch label="Cover my children" on={f.children} onChange={(v) => setF((x) => ({ ...x, children: v }))} />
        </Row>
        <Row title="Parents & parents-in-law" sub={`Up to ${MAX_PARENTS}`} extra={relies('parents')}>
          <Stepper
            label="parents"
            value={f.parents.length}
            max={MAX_PARENTS}
            onChange={(n) => setF((x) => ({ ...x, parents: n > x.parents.length ? [...x.parents, 'u65'] : x.parents.slice(0, n) }))}
          />
        </Row>
        {f.parents.map((b, i) => (
          <BandRow key={`p${i}`} label={`Parent ${i + 1}`} band={b} price={price(`parent${i}`)} onBand={(v) => setBand('parents', i, v)} />
        ))}
        <Row title="Extended family" sub="Siblings, grandparents, aunts, uncles, cousins">
          <Stepper
            label="extended family members"
            value={f.extended.length}
            max={MAX_EXTENDED}
            onChange={(n) => setF((x) => ({ ...x, extended: n > x.extended.length ? [...x.extended, 'u65'] : x.extended.slice(0, n) }))}
          />
        </Row>
        {f.extended.map((b, i) => (
          <BandRow key={`e${i}`} label={`Family member ${i + 1}`} band={b} price={price(`ext${i}`)} onBand={(v) => setBand('extended', i, v)} />
        ))}
      </div>

      <p className="text-xs leading-relaxed text-ink-500">{familyWaitingText()}</p>
      {f.children && (
        <p className="text-xs leading-relaxed text-ink-500">
          Children’s payouts are set by age: {CHILD_LIMITS.map((c) => `${c.label.toLowerCase()} up to ${R(Math.min(c.cap, f.amount))}`).join(', ')}.
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 border-t border-ink-100 bg-white px-6 pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink-700">Family cover</span>
          <span className="font-display text-xl font-extrabold tabular-nums text-ink-950">+{rand(total)}/mo</span>
        </div>
        <Button block onClick={() => onSave(f)}>
          {familyCount(f) ? 'Save family cover' : initial ? 'Remove family cover' : 'Done'}
        </Button>
      </div>
    </div>
  )
}

function Row({ title, sub, extra, price, children }: { title: string; sub?: string; extra?: React.ReactNode; price?: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3.5">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink-900">
          {title} {extra}
        </p>
        {(sub || price) && (
          <p className="text-xs text-ink-500">
            {sub}
            {sub && price ? ' · ' : ''}
            {price ? <span className="font-semibold text-ink-700">+{rand(price)}/mo</span> : null}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

function BandRow({ label, band, price, onBand }: { label: string; band: FamilyBand; price?: number; onBand: (b: FamilyBand) => void }) {
  return (
    <div className="bg-ink-50/60 px-3.5 py-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-700">{label} · age</span>
        {price !== undefined && <span className="font-semibold tabular-nums text-ink-700">+{rand(price)}/mo</span>}
      </div>
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={`${label} age range`}>
        {FAMILY_BANDS.map((b) => (
          <button
            key={b.value}
            role="radio"
            aria-checked={band === b.value}
            onClick={() => onBand(b.value)}
            className={cx(
              'h-9 rounded-lg text-sm font-semibold ring-1 transition',
              band === b.value ? 'bg-white text-brand-900 ring-2 ring-brand-600' : 'bg-white text-ink-600 ring-ink-200',
            )}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx(
        'relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30',
        on ? 'bg-brand-700' : 'bg-ink-200',
      )}
    >
      <span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

function Stepper({ value, max, onChange, label }: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  const btn = 'grid h-9 w-9 place-items-center rounded-full ring-1 ring-ink-200 text-ink-700 transition hover:bg-ink-50 disabled:opacity-35'
  return (
    <div className="flex items-center gap-2">
      <button className={btn} disabled={value <= 0} onClick={() => onChange(value - 1)} aria-label={`Remove one of your ${label}`}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-5 text-center font-semibold tabular-nums text-ink-900" aria-live="polite">
        {value}
      </span>
      <button className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`Add one of your ${label}`}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
