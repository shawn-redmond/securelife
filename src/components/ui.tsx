import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Check, ChevronDown, CircleAlert, Info, LoaderCircle, TriangleAlert, CircleCheck } from 'lucide-react'
import { cx } from '../lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg' | 'sm'
  loading?: boolean
  /** Looks disabled but stays focusable/clickable so we can explain why (inline error). */
  softDisabled?: boolean
  block?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'lg',
  loading,
  softDisabled,
  block,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 active:scale-[.98] disabled:cursor-not-allowed'
  const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4 text-[15px]', lg: 'h-14 px-6 text-base' }
  const variants: Record<Variant, string> = {
    primary: softDisabled
      ? 'bg-ink-200 text-ink-500 shadow-none'
      : 'bg-brand-700 text-white shadow-[0_6px_16px_-6px_rgba(4,117,92,.6)] hover:bg-brand-800 disabled:bg-ink-200 disabled:text-ink-500 disabled:shadow-none',
    secondary: 'bg-white text-ink-900 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:ring-ink-300',
    ghost: 'text-brand-700 hover:bg-brand-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-disabled={softDisabled || undefined}
      className={cx(base, sizes[size], variants[variant], block && 'w-full', className)}
    >
      {loading ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

export function LinkButton({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'rounded-md font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30',
        className,
      )}
    />
  )
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string
  hint?: ReactNode
  error?: string | null
  prefix?: ReactNode
  suffix?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, hint, error, prefix, suffix, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const fid = id ?? autoId
  return (
    <div className={className}>
      <label htmlFor={fid} className="mb-1.5 block text-sm font-semibold text-ink-800">
        {label}
      </label>
      <div
        className={cx(
          'flex h-14 items-center gap-2 rounded-xl bg-white px-4 ring-1 ring-inset transition focus-within:ring-2',
          error ? 'ring-rose-400 focus-within:ring-rose-500' : 'ring-ink-200 focus-within:ring-brand-600',
        )}
      >
        {prefix && <span className="text-ink-500">{prefix}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={!!error}
          aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
          className="h-full w-full min-w-0 bg-transparent text-base text-ink-900 placeholder:text-ink-400 focus:outline-none"
          {...rest}
        />
        {suffix}
      </div>
      {error ? (
        <p id={`${fid}-err`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-rose-600">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="mt-1.5 text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string | null
}

export function SelectField({ label, options, placeholder = 'Select…', error, className, id, ...rest }: SelectProps) {
  const autoId = useId()
  const fid = id ?? autoId
  return (
    <div className={className}>
      <label htmlFor={fid} className="mb-1.5 block text-sm font-semibold text-ink-800">
        {label}
      </label>
      <div className="relative">
        <select
          id={fid}
          className={cx(
            'h-14 w-full appearance-none rounded-xl bg-white px-4 pr-10 text-base text-ink-900 ring-1 ring-inset focus:outline-none focus:ring-2',
            error ? 'ring-rose-400' : 'ring-ink-200 focus:ring-brand-600',
            !rest.value && 'text-ink-400',
          )}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-ink-900">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" aria-hidden />
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-ink-700', className)}>
      <span className="relative mt-0.5 flex h-6 w-6 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-6 w-6 cursor-pointer appearance-none rounded-md bg-white ring-1 ring-inset ring-ink-300 transition checked:bg-brand-700 checked:ring-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
        />
        <Check className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
      </span>
      <span>{children}</span>
    </label>
  )
}

type Tone = 'info' | 'warning' | 'error' | 'success'
export function Alert({ tone = 'info', title, children, className, action }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode }) {
  const styles: Record<Tone, string> = {
    info: 'bg-sky-50 text-sky-900 ring-sky-200',
    warning: 'bg-amber-50 text-amber-900 ring-amber-200',
    error: 'bg-rose-50 text-rose-900 ring-rose-200',
    success: 'bg-brand-50 text-brand-900 ring-brand-200',
  }
  const Icon = { info: Info, warning: TriangleAlert, error: CircleAlert, success: CircleCheck }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('flex gap-3 rounded-xl p-4 text-sm ring-1 ring-inset animate-fade-up', styles[tone], className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  )
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-center justify-center gap-1.5 text-sm font-medium text-rose-600 animate-fade-up">
      <CircleAlert className="h-4 w-4 shrink-0" aria-hidden /> {children}
    </p>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl bg-white shadow-card ring-1 ring-ink-100', className)}>{children}</div>
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'ink' | 'amber' }) {
  const t = { brand: 'bg-brand-50 text-brand-800 ring-brand-200', ink: 'bg-ink-100 text-ink-700 ring-ink-200', amber: 'bg-amber-50 text-amber-800 ring-amber-200' }[tone]
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', t)}>{children}</span>
}
