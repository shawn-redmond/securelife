import type { LucideIcon } from 'lucide-react'
import { Ambulance, Car, HandHeart, HeartPulse, House } from 'lucide-react'

export type ProductId = 'medical' | 'household' | 'life' | 'critical' | 'motor'
export type CapClass = 'life' | 'nonLife'

export interface Option {
  value: string
  label: string
  hint?: string
}

export interface Field {
  id: string
  label: string
  kind: 'choice' | 'text' | 'select' | 'yesno'
  options?: Option[]
  placeholder?: string
  inputMode?: 'numeric' | 'text'
  maxLength?: number
  /** Field holds a sum assured that counts toward the product's aggregate cap. */
  sumAssured?: boolean
  /** Share answers with same-id fields in other branches (pre-fill only — branches stay independent). */
  shared?: boolean
}

export interface QuestionStep {
  id: string
  title: string
  subtitle?: string
  fields: Field[]
}

export interface Product {
  id: ProductId
  name: string
  short: string
  tagline: string
  icon: LucideIcon
  /** Tailwind classes for the product accent */
  tint: { bg: string; fg: string; ring: string; bar: string }
  /**
   * OPEN QUESTION (spec §7): whether critical illness and medical emergency are
   * life-class or non-life-class is pending underwriter confirmation. Configured
   * here as life-class so the shared-cap behaviour is demonstrable.
   */
  capClass: CapClass
  steps: QuestionStep[]
  claimsNote: string
}

const ageBands: Option[] = [
  { value: '18-29', label: '18 – 29' },
  { value: '30-39', label: '30 – 39' },
  { value: '40-49', label: '40 – 49' },
  { value: '50-59', label: '50 – 59' },
  { value: '60-65', label: '60 – 65' },
]

const ageStep = (title = 'How old are you?'): QuestionStep => ({
  id: 'age',
  title,
  subtitle: 'An age range is all we need.',
  fields: [{ id: 'ageBand', label: 'Age range', kind: 'choice', options: ageBands, shared: true }],
})

const thisYear = new Date().getFullYear()

/** Display order is deliberate: medical, household, life, critical illness, motor (spec §3). */
export const PRODUCTS: Product[] = [
  {
    id: 'medical',
    name: 'Medical Emergency',
    short: 'Medical',
    tagline: 'A cash payout when an accident or emergency puts you in hospital.',
    icon: Ambulance,
    tint: { bg: 'bg-rose-50', fg: 'text-rose-600', ring: 'ring-rose-200', bar: 'bg-rose-500' },
    capClass: 'life',
    claimsNote: 'Send your hospital admission note via WhatsApp — most claims paid in 48 hours.',
    steps: [
      ageStep(),
      {
        id: 'cover',
        title: 'How much emergency cover would help?',
        subtitle: 'Paid as a fixed amount when you’re admitted after an accident or emergency.',
        fields: [
          {
            id: 'cover',
            label: 'Cover amount',
            kind: 'choice',
            sumAssured: true,
            options: [
              { value: '10000', label: 'R10,000', hint: 'Covers transport and a short stay' },
              { value: '25000', label: 'R25,000', hint: 'Most popular' },
              { value: '50000', label: 'R50,000', hint: 'For longer recoveries' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'household',
    name: 'Household Contents',
    short: 'Household',
    tagline: 'A fixed payout if your things are lost to fire, flood or burglary.',
    icon: House,
    tint: { bg: 'bg-amber-50', fg: 'text-amber-600', ring: 'ring-amber-200', bar: 'bg-amber-500' },
    capClass: 'nonLife',
    claimsNote: 'Report a burglary with your SAPS case number; fire and flood with a few photos.',
    steps: [
      {
        id: 'where',
        title: 'Where is your home?',
        subtitle: 'Just the area — we don’t need your full address to price.',
        fields: [
          { id: 'suburb', label: 'Suburb or township', kind: 'text', placeholder: 'e.g. Soweto' },
          { id: 'postal', label: 'Postal code', kind: 'text', placeholder: 'e.g. 1804', inputMode: 'numeric', maxLength: 4 },
        ],
      },
      {
        id: 'homeType',
        title: 'What kind of home is it?',
        fields: [
          {
            id: 'homeType',
            label: 'Home type',
            kind: 'choice',
            options: [
              { value: 'house', label: 'House' },
              { value: 'flat', label: 'Flat or apartment' },
              { value: 'backroom', label: 'Back room or cottage' },
              { value: 'informal', label: 'Informal dwelling' },
            ],
          },
        ],
      },
      {
        id: 'tier',
        title: 'Choose your benefit level',
        subtitle: 'A fixed amount paid out on a valid claim — no inventories or valuations needed.',
        fields: [
          {
            id: 'tier',
            label: 'Benefit',
            kind: 'choice',
            sumAssured: true,
            options: [
              { value: '15000', label: 'Basic · R15,000', hint: 'Bed, fridge and the essentials' },
              { value: '30000', label: 'Standard · R30,000', hint: 'A typical furnished home' },
              { value: '60000', label: 'Plus · R60,000', hint: 'Electronics, appliances and more' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'life',
    name: 'Family Funeral & Life',
    short: 'Life',
    tagline: 'Fast cash for funeral costs — paid out within 48 hours.',
    icon: HandHeart,
    tint: { bg: 'bg-violet-50', fg: 'text-violet-600', ring: 'ring-violet-200', bar: 'bg-violet-500' },
    capClass: 'life',
    claimsNote: 'One call or WhatsApp with the death certificate — paid within 48 hours.',
    steps: [
      ageStep(),
      {
        id: 'smoker',
        title: 'Have you smoked in the last 12 months?',
        subtitle: 'Including cigarettes, hookah or vaping.',
        fields: [{ id: 'smoker', label: 'Smoker', kind: 'yesno', shared: true }],
      },
      {
        id: 'cover',
        title: 'How much should we pay your family?',
        subtitle: 'A typical funeral in South Africa costs R35,000 – R50,000.',
        fields: [
          {
            id: 'cover',
            label: 'Cover amount',
            kind: 'choice',
            sumAssured: true,
            options: [
              { value: '20000', label: 'R20,000', hint: 'A simple, dignified service' },
              { value: '35000', label: 'R35,000', hint: 'Covers a typical funeral' },
              { value: '50000', label: 'R50,000', hint: 'Funeral plus help with the months after' },
              { value: '75000', label: 'R75,000', hint: 'Extra breathing room for your family' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'critical',
    name: 'Critical Illness',
    short: 'Critical illness',
    tagline: 'A lump sum if you’re diagnosed with cancer, heart attack or stroke.',
    icon: HeartPulse,
    tint: { bg: 'bg-sky-50', fg: 'text-sky-600', ring: 'ring-sky-200', bar: 'bg-sky-500' },
    capClass: 'life',
    claimsNote: 'Your doctor’s diagnosis report is all we need to start.',
    steps: [
      ageStep(),
      {
        id: 'screening',
        title: 'A few quick health questions',
        subtitle: 'Answer honestly — it keeps your claim safe later.',
        fields: [
          { id: 'smoker', label: 'Have you smoked in the last 12 months?', kind: 'yesno', shared: true },
          { id: 'bp', label: 'Are you on treatment for high blood pressure or diabetes?', kind: 'yesno' },
          { id: 'history', label: 'Have you been diagnosed with cancer, a heart condition or stroke in the last 5 years?', kind: 'yesno' },
        ],
      },
      {
        id: 'cover',
        title: 'How much would you like paid on diagnosis?',
        fields: [
          {
            id: 'cover',
            label: 'Cover amount',
            kind: 'choice',
            sumAssured: true,
            options: [
              { value: '15000', label: 'R15,000' },
              { value: '30000', label: 'R30,000', hint: 'Most popular' },
              { value: '50000', label: 'R50,000' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'motor',
    name: 'Motor',
    short: 'Motor',
    tagline: 'A fixed payout if your car is stolen or written off.',
    icon: Car,
    tint: { bg: 'bg-slate-100', fg: 'text-slate-600', ring: 'ring-slate-300', bar: 'bg-slate-500' },
    capClass: 'nonLife',
    claimsNote: 'Report theft with a SAPS case number, or a write-off with the assessor’s report.',
    steps: [
      {
        id: 'vehicle',
        title: 'Tell us about your car',
        fields: [
          {
            id: 'make',
            label: 'Make',
            kind: 'select',
            options: ['Toyota', 'Volkswagen', 'Suzuki', 'Hyundai', 'Ford', 'Nissan', 'Renault', 'Kia', 'Chevrolet', 'Datsun', 'Mazda', 'Honda', 'Haval', 'Other'].map(
              (m) => ({ value: m, label: m }),
            ),
          },
          { id: 'model', label: 'Model', kind: 'text', placeholder: 'e.g. Corolla Quest' },
          {
            id: 'year',
            label: 'Year',
            kind: 'select',
            options: Array.from({ length: 30 }, (_, i) => String(thisYear - i)).map((y) => ({ value: y, label: y })),
          },
        ],
      },
      {
        id: 'driver',
        title: 'How old is the main driver?',
        fields: [{ id: 'driverAge', label: 'Main driver age', kind: 'choice', options: ageBands }],
      },
      {
        id: 'tier',
        title: 'Choose your benefit level',
        subtitle: 'A fixed amount paid if the car is stolen or written off — not a repair-cost policy.',
        fields: [
          {
            id: 'tier',
            label: 'Benefit',
            kind: 'choice',
            sumAssured: true,
            options: [
              { value: '25000', label: 'Basic · R25,000' },
              { value: '50000', label: 'Standard · R50,000', hint: 'Most popular' },
              { value: '100000', label: 'Plus · R100,000' },
            ],
          },
        ],
      },
    ],
  },
]

export const PRODUCT_ORDER: ProductId[] = PRODUCTS.map((p) => p.id)
export const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<ProductId, Product>
export const sortProducts = (ids: ProductId[]) => PRODUCT_ORDER.filter((id) => ids.includes(id))
