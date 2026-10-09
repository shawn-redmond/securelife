import type { ProductId } from './products'
import { sortProducts } from './products'

export type SituationId = 'dependants' | 'home' | 'medical' | 'car'

/** Display order is deliberate — car is shown last, never as a leading option (spec §4.2). */
export const SITUATIONS: { id: SituationId; label: string; emoji: string }[] = [
  { id: 'dependants', label: 'People depend on me for income or funeral costs', emoji: '👨‍👩‍👧' },
  { id: 'home', label: 'I own or rent somewhere with things worth protecting', emoji: '🏠' },
  { id: 'medical', label: 'I want broader medical/emergency cover', emoji: '🩺' },
  { id: 'car', label: 'I own or finance a car', emoji: '🚗' },
]

/** Fixed, deterministic mapping table (draft — confirm before build). */
export const SITUATION_TO_PRODUCT: Record<SituationId, ProductId> = {
  dependants: 'life',
  home: 'household',
  medical: 'medical',
  car: 'motor',
}

export const NAMED_BUNDLES: { name: string; blurb: string; products: ProductId[] }[] = [
  { name: 'Essentials', blurb: 'Funeral cover plus emergency medical — the basics, sorted.', products: ['life', 'medical'] },
  { name: 'Family Shield', blurb: 'Protects the people who depend on you and the home you share.', products: ['life', 'household', 'medical'] },
  { name: 'Homeowner', blurb: 'Your home’s contents and your family’s future, together.', products: ['household', 'life'] },
  { name: 'Complete Protection', blurb: 'Every cover we offer in one bundle.', products: ['medical', 'household', 'life', 'critical', 'motor'] },
  { name: 'Car Owner', blurb: 'Your car and your family, covered together.', products: ['motor', 'life'] },
]

export function recommend(situations: SituationId[]) {
  const products = sortProducts(situations.map((s) => SITUATION_TO_PRODUCT[s]))
  const match = NAMED_BUNDLES.find(
    (b) => b.products.length === products.length && b.products.every((p) => products.includes(p)),
  )
  return { products, bundle: match ?? null }
}
