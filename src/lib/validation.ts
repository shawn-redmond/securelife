/** SA mobile: 06x/07x/08x (10 digits) or +27 / 27 prefixed. */
export function normalisePhone(raw: string): string | null {
  const d = raw.replace(/[\s\-()]/g, '')
  let local: string
  if (/^\+27\d{9}$/.test(d)) local = '0' + d.slice(3)
  else if (/^27\d{9}$/.test(d)) local = '0' + d.slice(2)
  else if (/^0\d{9}$/.test(d)) local = d
  else return null
  return /^0[678]\d{8}$/.test(local) ? local : null
}

export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

function luhn(digits: string) {
  let sum = 0
  let dbl = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (dbl) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    dbl = !dbl
  }
  return sum % 10 === 0
}

/** South African ID: 13 digits, valid YYMMDD birth date, citizenship 0/1, Luhn checksum. */
export function validateSaId(id: string): string | null {
  const d = id.replace(/\s/g, '')
  if (!/^\d{13}$/.test(d)) return 'Your ID number should be 13 digits'
  const mm = Number(d.slice(2, 4))
  const dd = Number(d.slice(4, 6))
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "That ID number doesn't look right — please check it"
  if (!['0', '1'].includes(d[10])) return "That ID number doesn't look right — please check it"
  if (!luhn(d)) return "That ID number doesn't look right — please check it"
  return null
}

export function validateCard(num: string): string | null {
  const d = num.replace(/\s/g, '')
  if (!/^\d{13,19}$/.test(d)) return 'Enter the full card number'
  if (!luhn(d)) return "That card number isn't valid"
  return null
}

export function validateExpiry(exp: string): string | null {
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(exp)
  if (!m) return 'Use MM/YY'
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return 'Use MM/YY'
  const now = new Date()
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return 'This card has expired'
  return null
}

/** Standard SA bank account numbers are numeric, 7–11 digits. */
export function validateBankAccount(acc: string, bank: string): string | null {
  const d = acc.replace(/\s/g, '')
  if (!/^\d+$/.test(d)) return 'Account numbers contain digits only'
  const lengths: Record<string, [number, number]> = {
    capitec: [10, 10],
    fnb: [11, 11],
    absa: [10, 11],
    standard: [9, 11],
    nedbank: [10, 10],
    tymebank: [11, 11],
    african: [11, 11],
    discovery: [11, 11],
  }
  const [min, max] = lengths[bank] ?? [7, 11]
  if (d.length < min || d.length > max)
    return min === max ? `This bank uses ${min}-digit account numbers` : `This bank uses ${min}–${max} digit account numbers`
  return null
}

export const isPostalCode = (p: string) => /^\d{4}$/.test(p.trim())
