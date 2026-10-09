import { useEffect, useRef, useState } from 'react'
import { CircleCheck, Lock, Mail, Smartphone } from 'lucide-react'
import { Screen } from '../components/shell'
import { BundleSummary } from '../components/bundle'
import { Alert, Button, Checkbox, InlineError, LinkButton, TextField } from '../components/ui'
import { notify } from '../components/Toast'
import { config } from '../config'
import { maskPhone } from '../lib/format'
import { isEmail, normalisePhone } from '../lib/validation'
import { needsMembers, useStore } from '../state/store'

const genCode = () => String(Math.floor(100000 + Math.random() * 900000))

export function Contact() {
  const { state, set } = useStore()
  const c = state.customer
  const [phase, setPhase] = useState<'form' | 'otp' | 'done'>(c.contactVerified ? 'done' : 'form')
  const [firstName, setFirstName] = useState(c.firstName)
  const [phone, setPhone] = useState(c.phone)
  const [email, setEmail] = useState(c.email)
  const [consent, setConsent] = useState(false)
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const otp = useRef<{ code: string; issuedAt: number }>({ code: '', issuedAt: 0 })

  const phoneErr = normalisePhone(phone) ? null : phone ? 'Enter a valid South African cell number' : 'Enter your cell number'
  const emailErr = isEmail(email) ? null : email ? 'Enter a valid email address' : 'Enter your email address'
  const nameErr = firstName.trim() ? null : 'Tell us what to call you'
  const valid = !nameErr && !phoneErr && !emailErr && consent

  const sendCode = () => {
    otp.current = { code: genCode(), issuedAt: Date.now() }
    notify(`SMS to ${maskPhone(phone)}`, `Your SecureLife PIN is ${otp.current.code}. It expires in 5 minutes. Never share this PIN.`)
  }

  const submit = () => {
    setTouched(true)
    if (!valid) return
    setSending(true)
    setTimeout(() => {
      setSending(false)
      sendCode()
      setPhase('otp')
    }, 700)
  }

  if (phase === 'done')
    return (
      <Screen
        title="Your details are verified"
        subtitle="We’ll use these to send your policy documents and keep your progress safe."
        aside={<BundleSummary />}
        footer={
          <Button block onClick={() => set((s) => ({ step: needsMembers(s) ? 'members' : 'payment' }))}>
            Continue
          </Button>
        }
      >
        <div className="space-y-3">
          <VerifiedRow icon={<Smartphone className="h-5 w-5" />} label="Cell number" value={maskPhone(c.phone)} />
          <VerifiedRow icon={<Mail className="h-5 w-5" />} label="Email" value={c.email} />
        </div>
        {!state.policy && (
          <LinkButton
            className="mt-5 text-sm"
            onClick={() => {
              set((s) => ({ customer: { ...s.customer, contactVerified: false } }))
              setPhase('form')
            }}
          >
            Use different details
          </LinkButton>
        )}
      </Screen>
    )

  if (phase === 'otp')
    return (
      <OtpStep
        phone={phone}
        verify={(entered) => {
          const expired = state.demo.otpExpired || Date.now() - otp.current.issuedAt > config.otp.expirySeconds * 1000
          if (expired) {
            set((s) => ({ demo: { ...s.demo, otpExpired: false } }))
            sendCode()
            return 'expired'
          }
          if (entered !== otp.current.code) return 'wrong'
          const normal = normalisePhone(phone)!
          set((s) => ({ customer: { ...s.customer, firstName: firstName.trim(), phone: normal, email: email.trim(), contactVerified: true } }))
          notify(`Email to ${email.trim()}`, 'Your SecureLife Bundle application is saved. Tap the link in this message to pick up where you left off.')
          setTimeout(() => set((s) => ({ step: needsMembers(s) ? 'members' : 'payment' })), 900)
          return 'ok'
        }}
        resend={sendCode}
        editNumber={() => setPhase('form')}
      />
    )

  return (
    <Screen
      title="Where should we send your policy?"
      subtitle="We’ll text you a PIN to confirm it’s you. This also saves your progress, so you can finish later."
      aside={<BundleSummary />}
      footer={
        <div className="space-y-3">
          {touched && !consent && <InlineError>Please agree to the Privacy Notice to continue</InlineError>}
          <Button block softDisabled={!valid} loading={sending} onClick={submit}>
            Send my PIN
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <TextField
          label="First name"
          autoComplete="given-name"
          placeholder="What should we call you?"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={touched ? nameErr : null}
        />
        <TextField
          label="Cell number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="082 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => phone && setTouched(true)}
          error={touched ? phoneErr : null}
          prefix={<Smartphone className="h-5 w-5" aria-hidden />}
        />
        <TextField
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={touched ? emailErr : null}
          prefix={<Mail className="h-5 w-5" aria-hidden />}
        />
        <div className="rounded-xl bg-ink-50 p-4">
          <Checkbox checked={consent} onChange={setConsent}>
            I agree that {config.brand} may process my personal information to provide this quote and cover, as explained in the{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="font-semibold text-brand-700 underline underline-offset-2">
              Privacy Notice
            </a>
            .
          </Checkbox>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <Lock className="h-3.5 w-3.5" aria-hidden /> Protected under POPIA. We never sell your details.
        </p>
      </div>
    </Screen>
  )
}

function VerifiedRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink-100">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-50 text-ink-600">{icon}</span>
      <span className="flex-1">
        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</span>
        <span className="block font-semibold text-ink-900">{value}</span>
      </span>
      <CircleCheck className="h-5 w-5 text-brand-600" aria-label="Verified" />
    </div>
  )
}

function OtpStep({
  phone,
  verify,
  resend,
  editNumber,
}: {
  phone: string
  verify: (code: string) => 'ok' | 'wrong' | 'expired'
  resend: () => void
  editNumber: () => void
}) {
  const len = config.otp.length
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ tone: 'error' | 'info' | 'success'; text: string } | null>(null)
  const [left, setLeft] = useState<number>(config.otp.resendSeconds)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  useEffect(() => input.current?.focus(), [])

  const check = (value: string) => {
    const r = verify(value)
    if (r === 'ok') setMsg({ tone: 'success', text: 'Verified — your progress is saved.' })
    else {
      setCode('')
      if (r === 'wrong') setMsg({ tone: 'error', text: 'That code didn’t match. Try again or resend.' })
      else {
        setMsg({ tone: 'info', text: 'That code had expired, so we’ve sent you a new one.' })
        setLeft(config.otp.resendSeconds)
      }
      input.current?.focus()
    }
  }

  return (
    <Screen
      title="Enter your PIN"
      subtitle={
        <>
          We sent a {len}-digit PIN to <span className="font-semibold text-ink-900">{maskPhone(phone)}</span>.{' '}
          <LinkButton onClick={editNumber}>Change</LinkButton>
        </>
      }
      aside={<BundleSummary />}
    >
      <label className="sr-only" htmlFor="otp">
        {len}-digit PIN
      </label>
      <div className="relative" onClick={() => input.current?.focus()}>
        <input
          ref={input}
          id="otp"
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={len}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, len)
            setCode(v)
            setMsg(null)
            if (v.length === len) check(v)
          }}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        />
        <div className="grid grid-cols-6 gap-2 sm:gap-3" aria-hidden>
          {Array.from({ length: len }).map((_, i) => {
            const active = i === code.length
            return (
              <div
                key={i}
                className={`grid aspect-[4/5] place-items-center rounded-xl bg-white font-display text-2xl font-bold text-ink-950 ring-1 ring-inset transition sm:text-3xl ${
                  msg?.tone === 'error' ? 'ring-rose-400' : active ? 'ring-2 ring-brand-600' : code[i] ? 'ring-ink-300' : 'ring-ink-200'
                }`}
              >
                {code[i] ?? (active ? <span className="h-7 w-0.5 animate-pulse bg-brand-600" /> : '')}
              </div>
            )
          })}
        </div>
      </div>
      {msg && (
        <Alert className="mt-5" tone={msg.tone}>
          {msg.text}
        </Alert>
      )}
      <div className="mt-6 text-center text-sm text-ink-600">
        {left > 0 ? (
          <span>
            Didn’t get it? Resend in <span className="font-semibold tabular-nums text-ink-900">0:{String(left).padStart(2, '0')}</span>
          </span>
        ) : (
          <LinkButton
            onClick={() => {
              resend()
              setLeft(config.otp.resendSeconds)
              setMsg({ tone: 'info', text: 'New PIN sent.' })
              setCode('')
            }}
          >
            Resend PIN
          </LinkButton>
        )}
      </div>
    </Screen>
  )
}
