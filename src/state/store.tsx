import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import type { ProductId, QuestionStep } from '../data/products'
import { productById, sortProducts } from '../data/products'
import type { Profile, TierId } from '../data/plans'
import { familyCount, type FamilyCover, type MemberDetail } from '../data/family'
import type { AllAnswers } from '../lib/pricing'

export type StepId =
  | 'engage'
  | 'recommend'
  | 'plans'
  | 'pick'
  | 'questions'
  | 'quote'
  | 'contact'
  | 'members'
  | 'payment'
  | 'verify'
  | 'issued'
  | 'kyc'

export const STEP_NUMBER: Record<StepId, number> = {
  engage: 1,
  recommend: 2,
  plans: 3,
  pick: 3,
  questions: 4,
  quote: 5,
  contact: 6,
  members: 6,
  payment: 7,
  verify: 8,
  issued: 9,
  kyc: 10,
}

export type DocStatus = 'sent' | 'retrying'

/** Each product is a benefit on the customer's single policy. */
export interface PolicyBenefit {
  product: ProductId
  sumAssured: number
  /** Premium for the benefit itself (excludes family funeral lives). */
  monthly: number
  addedOn: string
}

/** One policy, one number, one document. Adding cover later endorses the same policy. */
export interface Policy {
  number: string
  startDate: string
  version: number
  docs: DocStatus
  benefits: PolicyBenefit[]
  family: FamilyCover | null
  familyMonthly: number
  members: MemberDetail[]
}

export type VerifyOutcome = 'success' | 'no-face' | 'liveness-fail' | 'id-mismatch'
export type KycTrigger = 'early-claim' | 'pep' | 'beneficiary' | 'payout'

export interface PaymentInfo {
  method: 'card' | 'debit'
  label: string
  debitDay?: string
}

export interface Application {
  profile: Profile
  /** Which profile question is showing on the recommender. */
  rIndex: number
  skippedRecommender: boolean
  /** The pre-built plan chosen, kept so we can tell when it has been customised. */
  plan: { id: TierId; name: string; covers: Partial<Record<ProductId, number>> } | null
  /** Plan path: ask only these product steps (`product:step`). null asks every step. */
  onlySteps: string[] | null
  selected: ProductId[]
  answers: AllAnswers
  qIndex: number
  /** When set, finishing this product's branch returns to the quote (upsell path). */
  returnToQuote: ProductId | null
  payment: PaymentInfo | null
  bindRef: string | null
  /** Extended-family funeral lives, priced on the Family Funeral & Life benefit. */
  family: FamilyCover | null
  members: MemberDetail[]
}

export interface Customer {
  phone: string
  email: string
  contactVerified: boolean
  idNumber: string
  identityVerified: boolean
}

export interface Beneficiary {
  name: string
  relationship: string
  phone: string
  share: number
}

export interface Demo {
  verifyOutcome: VerifyOutcome
  pricingUnavailable: ProductId[]
  docFailure: boolean
  otpExpired: boolean
  uploadFail: boolean
}

export interface State {
  step: StepId
  app: Application
  customer: Customer
  policy: Policy | null
  beneficiaries: Beneficiary[]
  kycTrigger: { type: KycTrigger; product: ProductId } | null
  kycDone: boolean
  demo: Demo
  savedAt: number | null
}

export const newApplication = (): Application => ({
  profile: {},
  rIndex: 0,
  skippedRecommender: false,
  plan: null,
  onlySteps: null,
  selected: [],
  answers: {},
  qIndex: 0,
  returnToQuote: null,
  payment: null,
  bindRef: null,
  family: null,
  members: [],
})

export const initialState = (): State => ({
  step: 'engage',
  app: newApplication(),
  customer: { phone: '', email: '', contactVerified: false, idNumber: '', identityVerified: false },
  policy: null,
  beneficiaries: [],
  kycTrigger: null,
  kycDone: false,
  demo: { verifyOutcome: 'success', pricingUnavailable: [], docFailure: false, otpExpired: false, uploadFail: false },
  savedAt: null,
})

export interface QItem {
  product: ProductId
  step: QuestionStep
  /** index of this step within its product branch */
  local: number
  total: number
}

export function questionList(selected: ProductId[], onlySteps: string[] | null = null): QItem[] {
  return sortProducts(selected).flatMap((product) => {
    const steps = productById[product].steps.filter((st) => !onlySteps || onlySteps.includes(`${product}:${st.id}`))
    return steps.map((step, local) => ({ product, step, local, total: steps.length }))
  })
}

export function branchComplete(product: ProductId, answers: AllAnswers) {
  const a = answers[product] ?? {}
  return productById[product].steps.every((s) => s.fields.every((f) => !!a[f.id]))
}

export const heldProducts = (s: State) => s.policy?.benefits.map((b) => b.product) ?? []

/** Family funeral lives need names and dates of birth before payment. */
export const needsMembers = (s: State) => s.app.selected.includes('life') && familyCount(s.app.family) > 0

export function prevStep(s: State): Partial<State> | null {
  switch (s.step) {
    case 'recommend':
      return s.app.rIndex > 0 ? { app: { ...s.app, rIndex: s.app.rIndex - 1 } } : { step: 'engage' }
    case 'plans':
      return { step: 'recommend' }
    case 'pick':
      return s.policy ? { step: 'issued' } : { step: 'recommend' }
    case 'questions': {
      const list = questionList(s.app.selected, s.app.onlySteps)
      const cur = list[s.app.qIndex]
      if (s.app.returnToQuote && cur?.product === s.app.returnToQuote && cur.local === 0)
        return { step: 'quote', app: { ...s.app, returnToQuote: null } }
      if (s.app.qIndex > 0) return { app: { ...s.app, qIndex: s.app.qIndex - 1 } }
      return { step: s.app.plan ? 'plans' : 'pick' }
    }
    case 'quote': {
      const list = questionList(s.app.selected, s.app.onlySteps)
      if (!list.length) return { step: s.app.plan ? 'plans' : 'pick' }
      return { step: 'questions', app: { ...s.app, qIndex: Math.max(0, list.length - 1), returnToQuote: null } }
    }
    case 'contact':
      return { step: 'quote' }
    case 'members':
      return { step: 'contact' }
    case 'payment':
      return { step: needsMembers(s) ? 'members' : 'contact' }
    default:
      return null
  }
}

/** Persist from step 6 onward per spec; earlier steps hold no personal data, but we keep them too so refresh never loses progress. */
const KEY = 'securelife-bundle:v4'

function load(): State | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as State
    return { ...initialState(), ...parsed, demo: { ...initialState().demo, ...parsed.demo } }
  } catch {
    return null
  }
}

type Action = { type: 'patch'; fn: (s: State) => Partial<State> } | { type: 'reset' }

function reducer(s: State, a: Action): State {
  if (a.type === 'reset') return initialState()
  return { ...s, ...a.fn(s) }
}

interface Ctx {
  state: State
  set: (fn: (s: State) => Partial<State>) => void
  go: (step: StepId) => void
  back: () => void
  canGoBack: boolean
  reset: () => void
  restored: State | null
}

const StoreContext = createContext<Ctx | null>(null)

const restoredAtBoot = load()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    // Resume where they left off; the Resume prompt lets them start over instead.
    return restoredAtBoot ?? initialState()
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
    } catch {
      /* storage unavailable — journey still works in-memory */
    }
  }, [state])

  const set = useCallback((fn: (s: State) => Partial<State>) => dispatch({ type: 'patch', fn }), [])
  const go = useCallback((step: StepId) => dispatch({ type: 'patch', fn: () => ({ step }) }), [])
  const back = useCallback(() => dispatch({ type: 'patch', fn: (s) => prevStep(s) ?? {} }), [])
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    dispatch({ type: 'reset' })
  }, [])

  // Keep the URL hash in step with the journey so the hardware/browser back button works.
  useEffect(() => {
    const hash = `#/${state.step}`
    try {
      if (location.hash !== hash) history.pushState(null, '', hash)
    } catch {
      /* sandboxed frames may block history writes */
    }
  }, [state.step])

  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    const onPop = () => {
      // Steps past payment can't be undone — keep the user where they are.
      if (!prevStep(stateRef.current)) {
        try {
          history.pushState(null, '', `#/${stateRef.current.step}`)
        } catch {
          /* ignore */
        }
        return
      }
      dispatch({ type: 'patch', fn: (s) => prevStep(s) ?? {} })
    }
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  // Scroll to top on every screen change for a clean, app-like transition.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [state.step, state.app.qIndex])

  const value = useMemo<Ctx>(
    () => ({
      state,
      set,
      go,
      back,
      canGoBack: prevStep(state) !== null,
      reset,
      restored: restoredAtBoot && restoredAtBoot.step !== 'engage' ? restoredAtBoot : null,
    }),
    [state, set, go, back, reset],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

export const ref = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now().toString().slice(-4)}`
