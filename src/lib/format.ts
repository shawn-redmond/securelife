const zar = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 })

export const rand = (n: number) => zar.format(n).replace(/ /g, ' ')

export const randShort = (n: number) => (n >= 1000 ? `R${Math.round(n / 1000)}k` : rand(n))

export const maskPhone = (p: string) => {
  const d = p.replace(/\D/g, '')
  const local = d.startsWith('27') ? '0' + d.slice(2) : d
  return local.length >= 10 ? `${local.slice(0, 3)} *** ${local.slice(-4)}` : p
}

export const longDate = (d: Date) =>
  d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

export const cx = (...c: unknown[]) => c.filter(Boolean).join(' ')
