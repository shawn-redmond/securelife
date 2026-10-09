import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Camera, FileUp, IdCard, LoaderCircle, MessageCircle, ScanFace, Send, Sun } from 'lucide-react'
import { Screen } from '../components/shell'
import { Alert, Button, Checkbox, LinkButton, TextField } from '../components/ui'
import { notify } from '../components/Toast'
import { config } from '../config'
import { maskPhone } from '../lib/format'
import { quoteBundle } from '../lib/pricing'
import { validateSaId } from '../lib/validation'
import { ref, useStore, type Policy, type PolicyBenefit, type State } from '../state/store'
import { familyCount, familyPremium } from '../data/family'

type Phase = 'intro' | 'camera' | 'checking' | 'success' | 'fallback' | 'mismatch' | 'paused' | 'review'

/**
 * Activate the policy once identity has passed. One check, one policy number, one document;
 * every product is a benefit on it. Adding cover later endorses the same policy as a new version.
 */
export function issuePolicies(s: State): Partial<State> {
  const q = quoteBundle(s.app.selected, s.app.answers, s.demo.pricingUnavailable)
  const now = new Date().toISOString()
  const benefits: PolicyBenefit[] = q.lines.flatMap(({ id, result }) =>
    result.ok ? [{ product: id, sumAssured: result.sumAssured, monthly: result.monthly, addedOn: now }] : [],
  )
  const withFamily = s.app.selected.includes('life') && familyCount(s.app.family) > 0
  const docs = s.demo.docFailure ? 'retrying' : 'sent'
  const prev = s.policy
  const policy: Policy = prev
    ? {
        ...prev,
        version: prev.version + 1,
        docs,
        benefits: [...prev.benefits, ...benefits],
        ...(withFamily ? { family: s.app.family, familyMonthly: familyPremium(s.app.family), members: s.app.members } : {}),
      }
    : {
        number: ref('SLB'),
        startDate: now,
        version: 1,
        docs,
        benefits,
        family: withFamily ? s.app.family : null,
        familyMonthly: withFamily ? familyPremium(s.app.family) : 0,
        members: withFamily ? s.app.members : [],
      }
  return { step: 'issued', policy, customer: { ...s.customer, identityVerified: true } }
}

export function Verify() {
  const { state, set } = useStore()
  const already = state.customer.identityVerified
  const [phase, setPhase] = useState<Phase>('intro')
  const [idNumber, setIdNumber] = useState(state.customer.idNumber)
  const [touched, setTouched] = useState(false)
  const [consent, setConsent] = useState(false)
  const [livenessFails, setLivenessFails] = useState(0)
  const [retryMsg, setRetryMsg] = useState<string | null>(null)
  const [noFaceUsed, setNoFaceUsed] = useState(false)
  const idErr = validateSaId(idNumber)

  // Already verified customers are never asked again (spec §4.8, §5).
  useEffect(() => {
    if (!already) return
    const t = setTimeout(() => set((s) => issuePolicies(s)), 1800)
    return () => clearTimeout(t)
  }, [already, set])

  if (already)
    return (
      <Screen title="You’re already verified" subtitle="Your ID check covers every benefit on your policy, so there’s no need to do it again.">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-700 animate-pop">
            <BadgeCheck className="h-10 w-10" aria-hidden />
          </span>
          <p className="flex items-center gap-2 text-ink-600">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Activating your new cover…
          </p>
        </div>
      </Screen>
    )

  const capture = () => {
    setPhase('checking')
    setRetryMsg(null)
    const outcome = state.demo.verifyOutcome
    setTimeout(() => {
      if (outcome === 'no-face' && !noFaceUsed) {
        setNoFaceUsed(true)
        setRetryMsg('We couldn’t get a clear shot. Try moving somewhere brighter, then try again.')
        return setPhase('camera')
      }
      if (outcome === 'liveness-fail') {
        const n = livenessFails + 1
        setLivenessFails(n)
        if (n >= 2) return setPhase('fallback')
        setRetryMsg('We couldn’t confirm it’s really you. Look straight at the camera and try once more.')
        return setPhase('camera')
      }
      if (outcome === 'id-mismatch') return setPhase('mismatch')
      setPhase('success')
      set((s) => ({ customer: { ...s.customer, idNumber: idNumber.replace(/\s/g, ''), identityVerified: true } }))
      setTimeout(() => set((s) => issuePolicies(s)), 1600)
    }, 2200)
  }

  const pause = () => {
    notify(`SMS to ${maskPhone(state.customer.phone)}`, 'Your cover is waiting! Finish your quick ID check here: securelife.example/r/••••')
    setPhase('paused')
  }

  if (phase === 'paused')
    return (
      <Screen title="We’ve saved your place" subtitle={`We sent a link to ${maskPhone(state.customer.phone)} and ${state.customer.email}. Tap it whenever you’re ready — your policy and payment are held.`}>
        <Button block onClick={() => setPhase('intro')}>
          Continue now
        </Button>
      </Screen>
    )

  if (phase === 'success')
    return (
      <Screen title="You’re verified" subtitle="Thanks — that’s the last step. Activating your policy now.">
        <div className="flex flex-col items-center gap-4 py-10">
          <span className="grid h-24 w-24 place-items-center rounded-full bg-brand-600 text-white shadow-lift animate-pop">
            <BadgeCheck className="h-12 w-12" aria-hidden />
          </span>
          <p className="flex items-center gap-2 text-ink-600">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Preparing your documents…
          </p>
        </div>
      </Screen>
    )

  if (phase === 'fallback' || phase === 'mismatch')
    return (
      <Screen
        title={phase === 'fallback' ? 'Let’s try another way' : 'We couldn’t verify your details'}
        subtitle={
          phase === 'fallback'
            ? 'The selfie check didn’t work this time. That happens — choose one of these quick options instead.'
            : 'We weren’t able to confirm your identity with the details provided. Please check your ID number, or choose another option below.'
        }
      >
        <div className="space-y-3">
          {phase === 'mismatch' && (
            <OptionRow icon={<IdCard className="h-5 w-5" />} title="Check my ID number" body="Make sure all 13 digits are correct." onClick={() => setPhase('intro')} />
          )}
          <OptionRow
            icon={<FileUp className="h-5 w-5" />}
            title="Upload a photo of my ID"
            body="Smart ID card or green ID book. We’ll review it within 1 working hour."
            onClick={() => setPhase('review')}
          />
          <OptionRow
            icon={<MessageCircle className="h-5 w-5" />}
            title="Chat to a person on WhatsApp"
            body={`A SecureLife agent will verify you on a quick video call. ${config.support.whatsapp}`}
            href={config.support.whatsappLink}
          />
        </div>
      </Screen>
    )

  if (phase === 'review')
    return (
      <Screen title="We’re reviewing your document" subtitle="Your payment and policy are held. We’ll SMS and email you as soon as your cover is active — usually within an hour.">
        <Alert tone="info" title="Nothing else to do right now">
          Policies only become active once your identity is confirmed, so you won’t be charged until then.
        </Alert>
        <Button
          className="mt-6"
          variant="secondary"
          block
          onClick={() => {
            set((s) => ({ customer: { ...s.customer, idNumber, identityVerified: true } }))
            set((s) => issuePolicies(s))
          }}
        >
          Demo: simulate approval
        </Button>
      </Screen>
    )

  if (phase === 'camera' || phase === 'checking')
    return (
      <Screen
        title={phase === 'checking' ? 'Checking with Home Affairs…' : 'Take a quick selfie'}
        subtitle={phase === 'checking' ? 'This usually takes a few seconds.' : 'Fit your face inside the oval and hold still.'}
        footer={
          phase === 'camera' && (
            <div className="space-y-3">
              <Button block onClick={capture} icon={<Camera className="h-5 w-5" aria-hidden />}>
                Take selfie
              </Button>
              <div className="text-center">
                <LinkButton onClick={pause} className="text-sm">
                  Finish later
                </LinkButton>
              </div>
            </div>
          )
        }
      >
        {retryMsg && (
          <Alert tone="warning" className="mb-4">
            {retryMsg}
          </Alert>
        )}
        <CameraView checking={phase === 'checking'} />
        <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-medium text-ink-600">
          <li className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 ring-1 ring-ink-100">
            <Sun className="h-5 w-5 text-amber-500" aria-hidden /> Good light
          </li>
          <li className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 ring-1 ring-ink-100">
            <ScanFace className="h-5 w-5 text-brand-600" aria-hidden /> Face the camera
          </li>
          <li className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 ring-1 ring-ink-100">
            <span className="text-base leading-none" aria-hidden>
              🧢
            </span>{' '}
            No hat or glasses
          </li>
        </ul>
      </Screen>
    )

  return (
    <Screen
      eyebrow={<p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Last step · about 1 minute</p>}
      title="Confirm it’s you"
      subtitle="The law (FICA) asks us to verify your identity once. It covers everyone and every benefit on your policy, now and in the future."
      footer={
        <div className="space-y-3">
          <Button
            block
            softDisabled={!!idErr || !consent}
            onClick={() => {
              setTouched(true)
              if (!idErr && consent) {
                set((s) => ({ customer: { ...s.customer, idNumber: idNumber.replace(/\s/g, '') } }))
                setPhase('camera')
              }
            }}
          >
            Continue to selfie
          </Button>
          <div className="text-center">
            <LinkButton onClick={pause} className="text-sm">
              Finish later
            </LinkButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <TextField
          label="South African ID number"
          inputMode="numeric"
          autoComplete="off"
          placeholder="13 digits"
          maxLength={13}
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
          onBlur={() => idNumber && setTouched(true)}
          error={touched ? idErr : null}
          prefix={<IdCard className="h-5 w-5" aria-hidden />}
          hint="Demo: try 9001015009086"
        />
        <div className="rounded-xl bg-ink-50 p-4">
          <Checkbox checked={consent} onChange={setConsent}>
            I consent to {config.brand} checking my ID number and selfie against the Department of Home Affairs records to verify my identity.
          </Checkbox>
          {touched && !consent && <p className="mt-2 text-sm font-medium text-rose-600">Please give consent to continue</p>}
        </div>
        <ol className="space-y-3 text-sm text-ink-600">
          {['Enter your ID number', 'Take a quick selfie', 'Your cover goes live'].map((t, i) => (
            <li key={t} className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>
    </Screen>
  )
}

function OptionRow({ icon, title, body, onClick, href }: { icon: React.ReactNode; title: string; body: string; onClick?: () => void; href?: string }) {
  const cls =
    'flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-ink-200 transition hover:ring-brand-400 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30'
  const inner = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold text-ink-900">{title}</span>
        <span className="block text-sm text-ink-600">{body}</span>
      </span>
      <Send className="h-4 w-4 text-ink-300" aria-hidden />
    </>
  )
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

function CameraView({ checking }: { checking: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        stream = s
        if (video.current) {
          video.current.srcObject = s
          setLive(true)
        }
      })
      .catch(() => setLive(false))
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-ink-900 shadow-lift">
      <video ref={video} autoPlay playsInline muted className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${live ? '' : 'hidden'}`} />
      {!live && (
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-ink-700 to-ink-900">
          <svg viewBox="0 0 200 220" className="h-[78%] text-ink-500" aria-hidden>
            <circle cx="100" cy="80" r="46" fill="currentColor" />
            <path d="M20 220c0-50 36-82 80-82s80 32 80 82z" fill="currentColor" />
          </svg>
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white">Demo camera</span>
        </div>
      )}
      {/* Face-position guide */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden>
        <defs>
          <mask id="oval">
            <rect width="300" height="400" fill="white" />
            <ellipse cx="150" cy="180" rx="95" ry="125" fill="black" />
          </mask>
        </defs>
        <rect width="300" height="400" fill="rgba(15,18,26,.55)" mask="url(#oval)" />
        <ellipse cx="150" cy="180" rx="95" ry="125" fill="none" stroke={checking ? '#30d0a0' : 'white'} strokeWidth="3" strokeDasharray={checking ? '0' : '8 6'} />
      </svg>
      {checking && (
        <div className="absolute inset-x-[18%] top-[14%] h-[62%] overflow-hidden">
          <div className="h-full w-full animate-scan bg-gradient-to-b from-transparent via-brand-400/40 to-transparent" />
        </div>
      )}
      <p className="absolute inset-x-0 bottom-4 text-center text-sm font-semibold text-white drop-shadow">
        {checking ? 'Matching…' : 'Position your face in the oval'}
      </p>
    </div>
  )
}
