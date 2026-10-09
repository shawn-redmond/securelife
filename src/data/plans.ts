import type { ProductId } from './products'
import { productById, sortProducts } from './products'
import type { AllAnswers } from '../lib/pricing'
import { capFor, capUsed, quoteBundle } from '../lib/pricing'
import { config } from '../config'

export type Travel = 'taxi' | 'bus' | 'car' | 'walk'
export type Dependants = 'me' | 'partner' | 'children' | 'extended'
export type Home = 'house' | 'flat' | 'informal' | 'family'
export type Budget = 'u150' | '150-300' | 'o300' | 'any'

export interface Profile {
  travel?: Travel
  dependants?: Dependants
  home?: Home
  ageBand?: string
  smoker?: 'yes' | 'no'
  budget?: Budget
}

export interface ProfileQuestion {
  id: 'travel' | 'dependants' | 'home' | 'about' | 'budget'
  title: string
  subtitle?: string
  options?: { value: string; label: string; emoji: string; hint?: string }[]
}

/** Short, situational questions. Travel comes first: most customers commute by taxi, bus or train. */
export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    id: 'travel',
    title: 'How do you usually get around?',
    options: [
      { value: 'taxi', label: 'Minibus taxi', emoji: '🚐' },
      { value: 'bus', label: 'Bus or train', emoji: '🚌' },
      { value: 'car', label: 'My own car', emoji: '🚗' },
      { value: 'walk', label: 'I walk or get lifts', emoji: '🚶' },
    ],
  },
  {
    id: 'dependants',
    title: 'Who would need help if something happened to you?',
    subtitle: 'Pick the one that fits best.',
    options: [
      { value: 'me', label: 'Just me', emoji: '🙋', hint: 'No one relies on my income' },
      { value: 'partner', label: 'My partner', emoji: '💑' },
      { value: 'children', label: 'My children', emoji: '👨‍👩‍👧' },
      { value: 'extended', label: 'Parents or extended family', emoji: '👵', hint: 'I help support family members' },
    ],
  },
  {
    id: 'home',
    title: 'Where do you live?',
    options: [
      { value: 'house', label: 'A house', emoji: '🏠', hint: 'Owned or rented' },
      { value: 'flat', label: 'A flat, room or backroom', emoji: '🏢' },
      { value: 'informal', label: 'An informal home', emoji: '🛖' },
      { value: 'family', label: 'In a family member’s home', emoji: '🏡', hint: 'Most of the furniture isn’t mine' },
    ],
  },
  { id: 'about', title: 'A little about you', subtitle: 'This sets your price. It won’t change at checkout.' },
  {
    id: 'budget',
    title: 'What’s comfortable to spend each month?',
    subtitle: 'Optional. We’ll recommend the best plan in your range.',
    options: [
      { value: 'u150', label: 'Under R150', emoji: '🪙' },
      { value: '150-300', label: 'R150 – R300', emoji: '💵' },
      { value: 'o300', label: 'More than R300', emoji: '💰' },
      { value: 'any', label: 'Not sure, show me everything', emoji: '🤔' },
    ],
  },
]

export type TierId = 'essential' | 'plus' | 'complete'

export interface Benefit {
  product: ProductId
  amount: number
  line: string
}

export interface Plan {
  id: TierId
  name: string
  pitch: string
  products: ProductId[]
  answers: AllAnswers
  benefits: Benefit[]
  monthly: number
}

const R = (n: number) => `R${n.toLocaleString('en-ZA')}`

function medicalLine(travel: Travel | undefined, amount: number) {
  if (travel === 'taxi') return `${R(amount)} if a road accident on your daily taxi ride, or any emergency, puts you in hospital`
  if (travel === 'bus') return `${R(amount)} if an accident on your commute, or any emergency, puts you in hospital`
  return `${R(amount)} if an accident or emergency puts you in hospital`
}

function lifeLine(dep: Dependants | undefined, amount: number) {
  const who = { me: 'your family', partner: 'your partner', children: 'your family', extended: 'your family' }[dep ?? 'me']
  return `${R(amount)} paid to ${who} within 48 hours for funeral costs`
}

/**
 * Pre-built plans: a fixed mapping from profile to three tiers.
 * Every combination is checked against the life-class cap below, so a plan is always within microinsurance limits.
 */
export function buildPlans(p: Profile): Plan[] {
  const hasHome = p.home !== 'family'
  const homeType = p.home === 'house' ? 'house' : p.home === 'informal' ? 'informal' : 'flat'
  const bigHome = p.home === 'house'
  const commuter = p.travel === 'taxi' || p.travel === 'bus'
  const car = p.travel === 'car'
  const supportsOthers = p.dependants !== 'me'
  const age = p.ageBand ?? '30-39'
  const smoker = p.smoker ?? 'no'

  const tiers: { id: TierId; name: string; pitch: string; covers: Partial<Record<ProductId, number>> }[] = [
    {
      id: 'essential',
      name: 'Essential',
      pitch: 'The basics: funeral and emergency cover.',
      covers: { life: supportsOthers ? 35000 : 20000, medical: commuter ? 25000 : 10000 },
    },
    {
      id: 'plus',
      name: supportsOthers ? 'Family' : 'Everyday',
      pitch: supportsOthers ? 'Protects the people who rely on you and what you own.' : 'Your health, your things and your future, covered.',
      covers: {
        medical: 25000,
        ...(hasHome ? { household: bigHome ? 30000 : 15000 } : {}),
        life: supportsOthers ? 50000 : 35000,
        ...(car ? { motor: 25000 } : {}),
      },
    },
    {
      id: 'complete',
      name: 'Complete',
      pitch: 'Our fullest cover, including critical illness.',
      covers: {
        medical: 25000,
        ...(hasHome ? { household: bigHome ? 60000 : 30000 } : {}),
        life: supportsOthers ? 75000 : 50000,
        critical: 30000,
        ...(car ? { motor: 50000 } : {}),
      },
    },
  ]

  return tiers.map((t) => {
    const products = sortProducts(Object.keys(t.covers) as ProductId[])
    const answers: AllAnswers = {}
    for (const id of products) {
      const amt = String(t.covers[id])
      answers[id] = {
        medical: { ageBand: age, cover: amt },
        household: { homeType, tier: amt },
        life: { ageBand: age, smoker, cover: amt },
        critical: { ageBand: age, smoker, bp: 'no', history: 'no', cover: amt },
        motor: { driverAge: age, tier: amt },
      }[id]
    }
    if (capUsed('life', products, answers) > capFor('life')) throw new Error(`Plan ${t.id} exceeds the life-class cap`)
    const benefits: Benefit[] = products.map((id) => {
      const amount = t.covers[id]!
      const line = {
        medical: medicalLine(p.travel, amount),
        household: `${R(amount)} if your things are lost to fire, flood or burglary`,
        life: lifeLine(p.dependants, amount),
        critical: `${R(amount)} if you’re diagnosed with cancer, a heart attack or stroke`,
        motor: `${R(amount)} if your car is stolen or written off`,
      }[id]
      return { product: id, amount, line }
    })
    return { ...t, products, answers, benefits, monthly: quoteBundle(products, answers).total }
  })
}

const BUDGET_MAX: Record<Budget, number> = { u150: 150, '150-300': 300, o300: Infinity, any: Infinity }

/** Highest tier inside the stated budget; the middle tier when no budget is given. */
export function recommendTier(plans: Plan[], budget?: Budget): { tier: TierId; overBudget: boolean } {
  if (!budget || budget === 'any') return { tier: 'plus', overBudget: false }
  if (budget === 'o300') return { tier: 'complete', overBudget: false }
  const fits = plans.filter((pl) => pl.monthly <= BUDGET_MAX[budget])
  if (!fits.length) return { tier: 'essential', overBudget: true }
  return { tier: fits[fits.length - 1].id, overBudget: false }
}

/** Steps a plan still needs answered (details that can't be assumed, like the car or area). */
export function missingSteps(products: ProductId[], answers: AllAnswers): string[] {
  return products.flatMap((id) =>
    productById[id].steps.filter((s) => s.fields.some((f) => !answers[id]?.[f.id])).map((s) => `${id}:${s.id}`),
  )
}

export const planFooter = `Month to month · cancel anytime · underwritten by ${config.underwriter.name}`
