/**
 * Single configurable source for regulated disclosure values and limits.
 * Spec §7 (Payment) requires FSP number + underwriter name to come from one
 * configurable source, not hardcoded on screens. Values below are PLACEHOLDERS
 * for the prototype — replace with confirmed values before go-live.
 */
export const config = {
  brand: 'SecureLife Bundle',
  brandFsp: 'FSP 00000',
  underwriter: {
    name: 'Example Microinsurer (RF) Ltd',
    fsp: 'FSP 00001',
    licence: 'Licensed microinsurer under the Insurance Act 18 of 2017',
  },
  /** Aggregate sum-assured caps per life insured (GOM 11.1, CPI-escalated, 2026 provisional). */
  caps: {
    life: 141_700,
    nonLife: 425_100,
  },
  support: {
    whatsapp: '+27 60 000 0000',
    whatsappLink: 'https://wa.me/27600000000',
    phone: '0860 000 000',
    email: 'help@securelife.example',
  },
  otp: {
    length: 6,
    resendSeconds: 30,
    expirySeconds: 300,
  },
  docsSla: { targetMinutes: 5, ceilingHours: 24 },
  /** PLACEHOLDERS: value messages must only state what is true. Confirm before go-live. */
  promises: {
    claimPayoutHours: 48,
    coolingOffDays: 31,
    /** Shown as social proof only once it is a real, current figure. */
    customersLabel: '10,000+ families',
  },
  /**
   * PLACEHOLDER waiting periods, per benefit. Shown wherever the claim promise appears,
   * so "paid within 48 hours" is never read without them. Confirm with the underwriter.
   */
  waiting: {
    life: { immediate: 'Accidental death', months: 6, later: 'natural causes' },
    medical: { immediate: 'Accidents', months: 3, later: 'other emergencies' },
    household: { immediate: null, months: 1, later: 'all claims' },
    critical: { immediate: null, months: 3, later: 'all claims' },
    motor: { immediate: null, months: 1, later: 'all claims' },
    /** Family funeral lives: natural causes, by age range. Accidental death is covered from day one. */
    family: { u65: 6, '65-74': 12, '75-84': 12 },
  },
  /** Ages a policyholder can join at (the age ranges offered). */
  entryAge: { min: 18, max: 65 },
  upload: {
    maxBytes: 5 * 1024 * 1024,
    accept: ['application/pdf', 'image/jpeg', 'image/png'],
    acceptLabel: 'PDF, JPG or PNG up to 5 MB',
  },
} as const
