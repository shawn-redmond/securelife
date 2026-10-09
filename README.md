# SecureLife Bundle — onboarding journey (front-end prototype)

A clickable, production-quality front end for the 10-step SecureLife Bundle onboarding journey (spec v11). There's no backend: pricing, OTP, payments, Home Affairs verification and document delivery are simulated in the browser so the whole journey can be demoed end to end.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/ (deploy anywhere, e.g. Netlify/Vercel/S3)
```

## The journey

| # | Screen | Where |
|---|--------|-------|
| 1 | Engage — "Cover, sorted in under 2 minutes." | `src/screens/Engage.tsx` |
| 2 | Recommender: 5 quick questions (travel, dependants (multi-select), home, age/smoker, optional budget) | `src/screens/Recommend.tsx` |
| 3 | Pick a plan: three ready-made tiers with amounts and final prices | `src/screens/Plans.tsx` |
| 3b | Build my own (picker, for customers who skip the plans) | `src/screens/Pick.tsx` |
| 4 | Per-product questions (one branch per product, cross-branch progress) | `src/screens/Questions.tsx` |
| 5 | Bundle quote (per-line + total, upsell, per-product pricing fallback) | `src/screens/Quote.tsx` |
| 6 | Contact capture + OTP (POPIA consent, resend countdown, save & resume) | `src/screens/Contact.tsx` |
| 7 | Payment & bind (DebiCheck debit order or card, static FSP disclosure) | `src/screens/Payment.tsx` |
| 8 | Identity verification (SA ID validation, selfie with face guide, fallbacks) | `src/screens/Verify.tsx` |
| 9 | Policy issued (per-product docs, download, beneficiaries, claims info) | `src/screens/Issued.tsx` |
| 10 | Progressive KYC escalation (event-triggered, uploads) | `src/screens/Kyc.tsx` |

## How the spec's rules are covered

- **Target-market ordering**: medical, household, life, critical illness, motor everywhere; car is never the lead option. Life is framed as fast-payout funeral cover.
- **Ready-made plans**: answers map to three tiers (Essential, Family or Everyday, Complete) in `src/data/plans.ts`. The middle tier is recommended, or the highest tier within the customer's budget. Taxi, bus and train commuters get medical emergency framed as road-accident cover. Car owners can add motor to any plan at a chosen benefit level; it's never built into a tier. The dependants question is multi-select (partner, children, parents or extended family), with "No one, just me" as an exclusive option. Each plan is checked against the life-class limit when it's built.
- **The plan price is the checkout price**: plans are priced from the age band and smoker answer, and area doesn't affect price. After choosing, the customer only answers what can't be assumed (their area for household cover, their car for motor), then lands on the quote. "Change amounts" opens every question, pre-filled, and the quote labels the plan as customised.
- **Microinsurance constraints**: every benefit is a fixed defined-benefit tier, never a replacement value. The life-class aggregate cap (R141,700) is shared across products. Amounts that would exceed it are disabled with an explanation, and the quote shows a cap meter. Caps, FSP numbers and the underwriter live in one config file: `src/config.ts`.
- **No PII before the quote**: steps 1–5 ask for no name, ID or contact details.
- **Verify once**: one ID check covers the whole bundle. "Add more cover" after issue reuses the verified identity, contact and payment method, so the customer goes straight from quote to activation.
- **Resilience**: journey state is kept in `localStorage`, so a refresh or return visit offers "Pick up where I left off". Browser and Android back buttons work. Card details are never stored.
- **No dead ends**: verification fails twice → document upload or WhatsApp human handoff. A pricing failure flags just that product. A document failure retries just that product. An upload failure → retry or WhatsApp.
- **Accessibility and UX**: mobile-first with a sticky thumb-zone CTA, 56px touch targets, labelled fields, inline errors with `role="alert"`, visible focus rings, reduced-motion support, and "soft-disabled" CTAs that explain why you can't continue yet.

## Demo controls

The **Demo** pill in the header lets a presenter trigger every edge state in the spec:

- pricing unavailable per product
- expired OTP
- verification outcomes (poor lighting, liveness failure ×2, ID mismatch)
- a document-delivery failure
- the four progressive-KYC triggers
- a failed upload
- a full reset

Handy demo values:

| What | Value |
|------|-------|
| OTP | shown in the simulated SMS toast |
| Card that succeeds | `4242 4242 4242 4242` |
| Card that is declined | `4000 0000 0000 0002` |
| Valid SA ID number | `9001015009086` |
| Natural pricing fallbacks | motor older than 20 years; "yes" to the critical-illness history question |

## Placeholders to replace before go-live

- FSP numbers, underwriter name and support contacts (`src/config.ts`)
- Benefit tiers and rates (`src/data/products.ts`, `src/lib/pricing.ts`) — the mock pricing engine stands in for the API layer
- Critical illness and medical emergency are configured as life-class (`capClass`). This is still an open underwriter question in spec §7.

Stack: React 19, TypeScript, Vite, Tailwind CSS 3 and lucide icons.
