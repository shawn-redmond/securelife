import { familyCount, type FamilyCover } from '../data/family'
import type { ProductId } from '../data/products'
import type { Dependant } from '../data/plans'
import { sumAssuredOf, type AllAnswers } from './pricing'

/** Monthly premium expressed per day, so the price reads as small and everyday. */
export const perDay = (monthly: number) => Math.max(1, Math.round((monthly * 12) / 365))

const join = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

/** "you, your partner, your children and 2 parents": the people a policy protects, in words. */
export function whoProtected(family: FamilyCover | null | undefined, childCount = 0, includeFamily = true) {
  const parts = ['you']
  if (includeFamily && family && familyCount(family)) {
    if (family.partner) parts.push('your partner')
    if (family.children) parts.push(childCount === 1 ? 'your child' : childCount > 1 ? `your ${childCount} children` : 'your children')
    if (family.parents.length) parts.push(family.parents.length === 1 ? '1 parent' : `${family.parents.length} parents`)
    if (family.extended.length) parts.push(family.extended.length === 1 ? '1 relative' : `${family.extended.length} relatives`)
  }
  return join(parts)
}

/** Known number of lives, when every child has been named; otherwise null. */
export function livesCount(family: FamilyCover | null | undefined, childCount: number) {
  if (!family || !familyCount(family)) return 1
  if (family.children && !childCount) return null
  return 1 + Number(family.partner) + (family.children ? childCount : 0) + family.parents.length + family.extended.length
}

/** The most the policy could pay out across benefits and family lives ("up to"). */
export function totalProtection(selected: ProductId[], answers: AllAnswers, family: FamilyCover | null | undefined, childCount = 0) {
  const own = selected.reduce((s, id) => s + sumAssuredOf(id, answers[id]), 0)
  if (!selected.includes('life') || !family) return own
  const adults = Number(family.partner) + family.parents.length + family.extended.length
  return own + family.amount * (adults + (family.children ? Math.max(1, childCount) : 0))
}

/** Personalised phrase from who the customer said relies on them. */
export function forWhom(deps: Dependant[] | undefined) {
  const names = { partner: 'your partner', children: 'your children', parents: 'your family' }
  const xs = (deps ?? []).filter((d): d is keyof typeof names => d !== 'me').map((d) => names[d])
  return xs.length ? `you and ${join(xs)}` : 'you'
}
