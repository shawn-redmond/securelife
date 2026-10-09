import { config } from '../config'
import type { CapClass, ProductId } from '../data/products'
import { productById, sortProducts } from '../data/products'

export type Answers = Record<string, string>
export type AllAnswers = Partial<Record<ProductId, Answers>>

export type PriceResult =
  | { ok: true; monthly: number; sumAssured: number }
  | { ok: false; reason: string }

const ageFactor: Record<string, number> = { '18-29': 0.8, '30-39': 1, '40-49': 1.3, '50-59': 1.75, '60-65': 2.3 }
const end9 = (n: number) => Math.max(9, Math.round(n / 10) * 10 - 1)

/**
 * MOCK pricing engine — stands in for the API layer. Deterministic so a demo
 * gives the same quote every time. Real rates are an actuarial decision.
 */
export function priceProduct(id: ProductId, a: Answers | undefined, forceUnavailable = false): PriceResult {
  if (!a) return { ok: false, reason: 'Missing answers' }
  if (forceUnavailable) return { ok: false, reason: 'Our pricing engine couldn’t return an instant price for this cover.' }
  const age = ageFactor[a.ageBand] ?? 1
  switch (id) {
    case 'medical': {
      const sa = Number(a.cover)
      const base = { 10000: 39, 25000: 69, 50000: 109 }[sa] ?? 69
      return { ok: true, monthly: end9(base * age), sumAssured: sa }
    }
    case 'household': {
      const sa = Number(a.tier)
      const base = { 15000: 49, 30000: 85, 60000: 149 }[sa] ?? 85
      // Area is captured for the policy record but doesn't move the price, so a plan's price never changes at checkout.
      const typeF = { house: 1, flat: 0.9, backroom: 1.05, informal: 1.2 }[a.homeType] ?? 1
      return { ok: true, monthly: end9(base * typeF), sumAssured: sa }
    }
    case 'life': {
      const sa = Number(a.cover)
      const base = { 20000: 45, 35000: 69, 50000: 95, 75000: 135 }[sa] ?? 69
      return { ok: true, monthly: end9(base * age * (a.smoker === 'yes' ? 1.25 : 1)), sumAssured: sa }
    }
    case 'critical': {
      if (a.history === 'yes')
        return { ok: false, reason: 'Your health answers need a quick review by our team before we can price this cover.' }
      const sa = Number(a.cover)
      const base = { 15000: 39, 30000: 69, 50000: 109 }[sa] ?? 69
      const f = age * (a.smoker === 'yes' ? 1.3 : 1) * (a.bp === 'yes' ? 1.2 : 1)
      return { ok: true, monthly: end9(base * f), sumAssured: sa }
    }
    case 'motor': {
      const year = Number(a.year)
      if (year && new Date().getFullYear() - year > 20)
        return { ok: false, reason: 'Cars older than 20 years need a quick manual check before we can price them.' }
      const sa = Number(a.tier)
      const base = { 25000: 119, 50000: 189, 100000: 299 }[sa] ?? 189
      const driver = ageFactor[a.driverAge] ?? 1
      const driverF = driver < 1 ? 1.35 : driver > 1.5 ? 1.15 : 1
      return { ok: true, monthly: end9(base * driverF), sumAssured: sa }
    }
  }
}

export function sumAssuredOf(id: ProductId, a: Answers | undefined): number {
  if (!a) return 0
  const field = productById[id].steps.flatMap((s) => s.fields).find((f) => f.sumAssured)
  return field ? Number(a[field.id] || 0) : 0
}

/** Aggregate cap used by a class across the bundle, optionally excluding one product. */
export function capUsed(cls: CapClass, selected: ProductId[], answers: AllAnswers, exclude?: ProductId) {
  return selected
    .filter((id) => id !== exclude && productById[id].capClass === cls)
    .reduce((sum, id) => sum + sumAssuredOf(id, answers[id]), 0)
}

export const capFor = (cls: CapClass) => config.caps[cls]

export function quoteBundle(selected: ProductId[], answers: AllAnswers, unavailable: ProductId[] = []) {
  const lines = sortProducts(selected).map((id) => ({ id, result: priceProduct(id, answers[id], unavailable.includes(id)) }))
  const total = lines.reduce((s, l) => s + (l.result.ok ? l.result.monthly : 0), 0)
  return { lines, total, priced: lines.filter((l) => l.result.ok).map((l) => l.id) }
}
