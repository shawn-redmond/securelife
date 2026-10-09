import { useRef, useState } from 'react'
import { CircleCheck, FileUp, MessageCircle, Paperclip, ShieldAlert, X } from 'lucide-react'
import { Screen } from '../components/shell'
import { Alert, Button, InlineError } from '../components/ui'
import { productById } from '../data/products'
import { config } from '../config'
import { cx } from '../lib/format'
import { useStore, type KycTrigger } from '../state/store'

const TRIGGER_COPY: Record<KycTrigger, (product: string) => string> = {
  'early-claim': (p) => `You’ve recently submitted a claim on your ${p} cover, shortly after it started. We check all early claims to protect every customer.`,
  pep: (p) => `A routine screening check on your ${p} cover needs us to confirm a few more details about you or a beneficiary.`,
  beneficiary: (p) => `The beneficiary on your ${p} cover was changed shortly before a claim, so we need to confirm a few details.`,
  payout: (p) => `We noticed an unusual pattern of payouts across your policy, including your ${p} benefit. This is a routine check.`,
}

type Slot = 'address' | 'id'

export function Kyc() {
  const { state, set } = useStore()
  const trig = state.kycTrigger ?? { type: 'early-claim' as KycTrigger, product: state.policy?.benefits[0]?.product ?? 'life' }
  const [files, setFiles] = useState<Record<Slot, File | null>>({ address: null, id: null })
  const [errors, setErrors] = useState<Record<Slot, string | null>>({ address: null, id: null })
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (state.kycDone)
    return (
      <Screen title="Thanks — we’ve got everything" subtitle="Our team will review your documents within 1 working day. Your claim and cover carry on as normal in the meantime.">
        <div className="flex justify-center py-8">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-white animate-pop">
            <CircleCheck className="h-10 w-10" aria-hidden />
          </span>
        </div>
        <Button block variant="secondary" onClick={() => set(() => ({ step: 'issued', kycTrigger: null, kycDone: false }))}>
          Back to my policies
        </Button>
      </Screen>
    )

  const pick = (slot: Slot, f: File | null) => {
    setFailed(false)
    if (!f) return setFiles((x) => ({ ...x, [slot]: null }))
    // Validated before any upload starts.
    if (!(config.upload.accept as readonly string[]).includes(f.type))
      return setErrors((e) => ({ ...e, [slot]: `That file type isn’t supported. Use ${config.upload.acceptLabel}.` }))
    if (f.size > config.upload.maxBytes) return setErrors((e) => ({ ...e, [slot]: `That file is too large. Use ${config.upload.acceptLabel}.` }))
    setErrors((e) => ({ ...e, [slot]: null }))
    setFiles((x) => ({ ...x, [slot]: f }))
  }

  const upload = () => {
    setSubmitted(true)
    if (!files.address || !files.id) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (state.demo.uploadFail) {
        set((s) => ({ demo: { ...s.demo, uploadFail: false } }))
        return setFailed(true)
      }
      set(() => ({ kycDone: true }))
    }, 1500)
  }

  return (
    <Screen
      eyebrow={
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-6 w-6" aria-hidden />
        </span>
      }
      title="We need a bit more information"
      subtitle={TRIGGER_COPY[trig.type](productById[trig.product].name)}
      footer={
        <div className="space-y-3">
          {submitted && (!files.address || !files.id) && <InlineError>Add both documents to continue</InlineError>}
          <Button block softDisabled={!files.address || !files.id} loading={busy} onClick={upload}>
            Upload documents
          </Button>
        </div>
      }
    >
      {failed && (
        <Alert
          tone="error"
          title="Your upload didn’t go through"
          className="mb-5"
          action={
            <>
              <Button size="sm" onClick={upload}>
                Try again
              </Button>
              <a href={config.support.whatsappLink} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-ink-900 ring-1 ring-inset ring-rose-200">
                <MessageCircle className="h-4 w-4 text-brand-600" /> Send via WhatsApp
              </a>
            </>
          }
        >
          Your claim won’t be held up — you can also send the documents to {config.support.email}.
        </Alert>
      )}
      <div className="space-y-4">
        <Dropzone label="Proof of address" hint="Utility bill, bank statement or a letter from your ward councillor — less than 3 months old." file={files.address} error={errors.address} onPick={(f) => pick('address', f)} />
        <Dropzone label="Enhanced ID check" hint="A clear photo of both sides of your Smart ID card, or your green ID book photo page." file={files.id} error={errors.id} onPick={(f) => pick('id', f)} />
      </div>
      <p className="mt-5 text-xs text-ink-500">Accepted: {config.upload.acceptLabel}. This request and the related policy are logged for audit purposes.</p>
    </Screen>
  )
}

function Dropzone({ label, hint, file, error, onPick }: { label: string; hint: string; file: File | null; error: string | null; onPick: (f: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink-800">{label}</p>
      {file ? (
        <div className="flex items-center gap-3 rounded-2xl bg-brand-50/60 p-4 ring-1 ring-brand-200">
          <Paperclip className="h-5 w-5 text-brand-700" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{file.name}</span>
          <span className="text-xs text-ink-500">{(file.size / 1024).toFixed(0)} KB</span>
          <button onClick={() => onPick(null)} className="grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-white" aria-label={`Remove ${file.name}`}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            onPick(e.dataTransfer.files[0] ?? null)
          }}
          className={cx(
            'flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30',
            error ? 'border-rose-300 bg-rose-50/50' : over ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-400',
          )}
        >
          <FileUp className="h-6 w-6 text-brand-600" aria-hidden />
          <span className="text-sm font-semibold text-ink-900">Take a photo or choose a file</span>
          <span className="text-xs text-ink-500">{hint}</span>
        </button>
      )}
      <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => (onPick(e.target.files?.[0] ?? null), (e.target.value = ''))} />
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
