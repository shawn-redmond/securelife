import { useState } from 'react'
import { Header, Sheet } from './components/shell'
import { Toaster } from './components/Toast'
import { Button } from './components/ui'
import { maskPhone } from './lib/format'
import { useStore, type StepId } from './state/store'
import { Engage } from './screens/Engage'
import { Recommend } from './screens/Recommend'
import { Plans } from './screens/Plans'
import { Pick } from './screens/Pick'
import { Questions } from './screens/Questions'
import { Quote } from './screens/Quote'
import { Contact } from './screens/Contact'
import { Members } from './screens/Members'
import { Payment } from './screens/Payment'
import { Verify } from './screens/Verify'
import { Issued } from './screens/Issued'
import { Kyc } from './screens/Kyc'

const SCREENS: Record<StepId, () => React.ReactElement | null> = {
  engage: Engage,
  recommend: Recommend,
  plans: Plans,
  pick: Pick,
  questions: Questions,
  quote: Quote,
  contact: Contact,
  members: Members,
  payment: Payment,
  verify: Verify,
  issued: Issued,
  kyc: Kyc,
}

export default function App() {
  const { state } = useStore()
  const Current = SCREENS[state.step]
  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f8f6]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Header />
      <div id="main" className="flex flex-1 flex-col">
        <Current key={state.step} />
      </div>
      <ResumePrompt />
      <Toaster />
    </div>
  )
}

function ResumePrompt() {
  const { restored, reset } = useStore()
  const [open, setOpen] = useState(!!restored && restored.step !== 'issued')
  if (!restored) return null
  const n = restored.app.selected.length
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Welcome back">
      <p className="text-ink-600">
        {restored.customer.contactVerified
          ? `We saved your application for ${maskPhone(restored.customer.phone)}. `
          : 'You were part-way through your quote. '}
        {n > 0 && `Your ${n} selected cover${n > 1 ? 's are' : ' is'} still here.`}
      </p>
      <div className="mt-6 space-y-3">
        <Button block onClick={() => setOpen(false)}>
          Pick up where I left off
        </Button>
        <Button
          block
          variant="secondary"
          onClick={() => {
            reset()
            setOpen(false)
          }}
        >
          Start over
        </Button>
      </div>
    </Sheet>
  )
}
