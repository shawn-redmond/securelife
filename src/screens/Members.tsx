import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Screen } from '../components/shell'
import { Button, Checkbox, InlineError, SelectField, TextField } from '../components/ui'
import { bandLabel, childAmount, type FamilyBand, type MemberDetail } from '../data/family'
import { rand } from '../lib/format'
import { useStore } from '../state/store'

const PARENT_RELATIONS = ['Mother', 'Father', 'Mother-in-law', 'Father-in-law']
const EXTENDED_RELATIONS = ['Brother', 'Sister', 'Grandmother', 'Grandfather', 'Aunt', 'Uncle', 'Cousin', 'Niece', 'Nephew', 'Other relative']
const MAX_CHILDREN = 8

interface Slot extends MemberDetail {
  kind: 'partner' | 'child' | 'parent' | 'extended'
  band?: FamilyBand
  index: number
}

const fmtDob = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/')
}

function ageOn(dob: string): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob)
  if (!m) return null
  const [dd, mm, yyyy] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(yyyy, mm - 1, dd)
  if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d > new Date() || yyyy < 1900) return null
  const now = new Date()
  let age = now.getFullYear() - yyyy
  if (now.getMonth() < mm - 1 || (now.getMonth() === mm - 1 && now.getDate() < dd)) age--
  return age
}

const bandFor = (age: number): FamilyBand | null => (age < 65 ? 'u65' : age <= 74 ? '65-74' : age <= 84 ? '75-84' : null)

export function Members() {
  const { state, set } = useStore()
  const family = state.app.family!
  const saved = Object.fromEntries(state.app.members.map((m) => [m.key, m]))

  const initial = useMemo<Slot[]>(() => {
    const out: Slot[] = []
    const take = (key: string, kind: Slot['kind'], relation: string, index: number, band?: FamilyBand) =>
      out.push({ key, kind, index, band, relation: saved[key]?.relation ?? relation, name: saved[key]?.name ?? '', dob: saved[key]?.dob ?? '' })
    if (family.partner) take('partner', 'partner', 'Partner', 0)
    if (family.children) {
      const n = Math.max(1, state.app.members.filter((m) => m.key.startsWith('child')).length)
      for (let i = 0; i < n; i++) take(`child${i}`, 'child', 'Child', i)
    }
    family.parents.forEach((b, i) => take(`parent${i}`, 'parent', '', i, b))
    family.extended.forEach((b, i) => take(`ext${i}`, 'extended', '', i, b))
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [slots, setSlots] = useState<Slot[]>(initial)
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const errorsFor = (s: Slot) => {
    const e: { name?: string; dob?: string; relation?: string; fixBand?: FamilyBand } = {}
    if (s.name.trim().split(/\s+/).length < 2) e.name = 'Enter their first name and surname'
    if (!s.relation) e.relation = 'Choose how they’re related to you'
    const age = ageOn(s.dob)
    if (age === null) e.dob = 'Enter a real date as DD/MM/YYYY'
    else if (s.kind === 'child' && age > 21) e.dob = 'Children are covered until 21. Add them as extended family instead.'
    else if (s.kind === 'partner' && age < 18) e.dob = 'Partners must be 18 or older'
    else if ((s.kind === 'parent' || s.kind === 'extended') && s.band) {
      const actual = bandFor(age)
      if (!actual) e.dob = 'We can cover family members up to age 84'
      else if (actual !== s.band) {
        e.dob = `That makes them ${age}, but they were priced as ${bandLabel(s.band)}.`
        e.fixBand = actual
      }
    }
    return e
  }
  const allErrors = slots.map(errorsFor)
  const valid = allErrors.every((e) => Object.keys(e).length === 0) && consent

  const patch = (key: string, p: Partial<Slot>) => setSlots((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)))

  // Correcting an age range re-prices that person on the family cover.
  const fixBand = (s: Slot, band: FamilyBand) => {
    const list = s.kind === 'parent' ? 'parents' : 'extended'
    set((st) => ({ app: { ...st.app, family: { ...st.app.family!, [list]: st.app.family![list].map((b, i) => (i === s.index ? band : b)) } } }))
    patch(s.key, { band })
  }

  const children = slots.filter((s) => s.kind === 'child')
  const addChild = () =>
    setSlots((xs) => {
      const at = xs.findIndex((x) => x.kind === 'child') + children.length
      const next: Slot = { key: `child${children.length}`, kind: 'child', index: children.length, relation: 'Child', name: '', dob: '' }
      return [...xs.slice(0, at), next, ...xs.slice(at)]
    })
  const removeChild = (key: string) =>
    setSlots((xs) => {
      let i = 0
      return xs.filter((x) => x.key !== key).map((x) => (x.kind === 'child' ? { ...x, key: `child${i}`, index: i++ } : x))
    })

  const submit = () => {
    setSubmitted(true)
    if (!valid) return
    set((s) => ({ step: 'payment', app: { ...s.app, members: slots.map(({ key, relation, name, dob }) => ({ key, relation, name: name.trim(), dob })) } }))
  }

  const title = (s: Slot) =>
    s.kind === 'partner' ? 'Your partner' : s.kind === 'child' ? `Child ${s.index + 1}` : s.kind === 'parent' ? `Parent ${s.index + 1}` : `Family member ${s.index + 1}`

  return (
    <Screen
      title="Who’s covered"
      subtitle={`Tell us about the family members on your funeral cover. Each adult gets ${rand(family.amount)}.`}
      footer={
        <div className="space-y-3">
          {submitted && !valid && <InlineError>{consent ? 'Check the highlighted details' : 'Please confirm you can share their details'}</InlineError>}
          <Button block softDisabled={!valid} onClick={submit}>
            Continue to payment
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {slots.map((s, i) => {
          const e = submitted ? allErrors[i] : {}
          const age = ageOn(s.dob)
          return (
            <fieldset key={s.key} className="rounded-2xl bg-white p-4 ring-1 ring-ink-200 sm:p-5">
              <legend className="sr-only">{title(s)}</legend>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-ink-950">
                  {title(s)}
                  {s.band && <span className="ml-2 text-sm font-normal text-ink-500">{bandLabel(s.band)}</span>}
                </p>
                {s.kind === 'child' && children.length > 1 && (
                  <button onClick={() => removeChild(s.key)} className="grid h-8 w-8 place-items-center rounded-full text-ink-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${title(s)}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {(s.kind === 'parent' || s.kind === 'extended') && (
                  <SelectField
                    label="Relationship to you"
                    value={s.relation}
                    error={e.relation}
                    options={(s.kind === 'parent' ? PARENT_RELATIONS : EXTENDED_RELATIONS).map((v) => ({ value: v, label: v }))}
                    onChange={(ev) => patch(s.key, { relation: ev.target.value })}
                  />
                )}
                <TextField label="Full name" autoComplete="off" value={s.name} error={e.name} onChange={(ev) => patch(s.key, { name: ev.target.value })} />
                <TextField
                  label="Date of birth"
                  inputMode="numeric"
                  placeholder="DD/MM/YYYY"
                  value={s.dob}
                  error={e.dob}
                  hint={s.kind === 'child' && age !== null && age <= 21 ? `Funeral payout ${rand(childAmount(family.amount, age))}` : undefined}
                  onChange={(ev) => patch(s.key, { dob: fmtDob(ev.target.value) })}
                />
                {e.fixBand && (
                  <Button size="sm" variant="secondary" onClick={() => fixBand(s, e.fixBand!)}>
                    Update to {bandLabel(e.fixBand)} (price will change)
                  </Button>
                )}
              </div>
            </fieldset>
          )
        })}
        {family.children && children.length < MAX_CHILDREN && (
          <button
            onClick={addChild}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 p-4 text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50/40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add another child
          </button>
        )}
        <div className="rounded-xl bg-ink-50 p-4">
          <Checkbox checked={consent} onChange={setConsent}>
            I confirm these family members know they’re being covered and that I may share their details for this policy.
          </Checkbox>
        </div>
      </div>
    </Screen>
  )
}
