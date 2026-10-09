/**
 * Extended-family funeral cover. Each family member is a separate life insured under the
 * policy's Family Funeral & Life benefit, with their own fixed funeral amount.
 *
 * PLACEHOLDERS: amounts, rates and the children's limits below are prototype values.
 * The legal maximum funeral benefits for young children must be confirmed with compliance.
 */

export type FamilyBand = 'u65' | '65-74' | '75-84'

export const FAMILY_BANDS: { value: FamilyBand; label: string }[] = [
  { value: 'u65', label: 'Under 65' },
  { value: '65-74', label: '65 – 74' },
  { value: '75-84', label: '75 – 84' },
]

export const FAMILY_AMOUNTS = [10000, 20000, 30000]
export const MAX_PARENTS = 4
export const MAX_EXTENDED = 6

/** Children's funeral benefit by age, never more than the adult amount. Confirm limits with compliance. */
export const CHILD_LIMITS: { label: string; maxAge: number; cap: number }[] = [
  { label: 'Under 6', maxAge: 5, cap: 10000 },
  { label: '6 – 13', maxAge: 13, cap: 20000 },
  { label: '14 – 21', maxAge: 21, cap: 30000 },
]

export interface FamilyCover {
  /** Funeral amount for each adult family member. */
  amount: number
  partner: boolean
  /** All children under 21, covered for one flat premium. */
  children: boolean
  parents: FamilyBand[]
  extended: FamilyBand[]
}

export const emptyFamily = (): FamilyCover => ({ amount: 20000, partner: false, children: false, parents: [], extended: [] })

export const familyCount = (f: FamilyCover | null | undefined) =>
  f ? Number(f.partner) + Number(f.children) + f.parents.length + f.extended.length : 0

/** Monthly rate per R10,000 of funeral cover. */
const RATE = { partner: 9, children: 6, parent: { u65: 18, '65-74': 32, '75-84': 55 }, extended: { u65: 20, '65-74': 36, '75-84': 62 } }

const per10k = (f: FamilyCover) => f.amount / 10000
const end9 = (n: number) => Math.max(9, Math.round(n / 10) * 10 - 1)

export function familyLines(f: FamilyCover | null | undefined) {
  if (!f) return []
  const lines: { key: string; label: string; amount: number; monthly: number }[] = []
  if (f.partner) lines.push({ key: 'partner', label: 'Partner', amount: f.amount, monthly: end9(RATE.partner * per10k(f)) })
  if (f.children) lines.push({ key: 'children', label: 'Children', amount: f.amount, monthly: end9(RATE.children * per10k(f)) })
  f.parents.forEach((b, i) =>
    lines.push({ key: `parent${i}`, label: `Parent ${i + 1} · ${bandLabel(b)}`, amount: f.amount, monthly: end9(RATE.parent[b] * per10k(f)) }),
  )
  f.extended.forEach((b, i) =>
    lines.push({ key: `ext${i}`, label: `Relative ${i + 1} · ${bandLabel(b)}`, amount: f.amount, monthly: end9(RATE.extended[b] * per10k(f)) }),
  )
  return lines
}

export const familyPremium = (f: FamilyCover | null | undefined) => familyLines(f).reduce((s, l) => s + l.monthly, 0)

export const bandLabel = (b: FamilyBand) => FAMILY_BANDS.find((x) => x.value === b)!.label

export const childAmount = (adultAmount: number, age: number) =>
  Math.min(adultAmount, CHILD_LIMITS.find((c) => age <= c.maxAge)?.cap ?? adultAmount)

/** Details captured after the quote (names are personal data, so never before step 6). */
export interface MemberDetail {
  key: string
  relation: string
  name: string
  dob: string
}
