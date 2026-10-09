# SecureLife Bundle onboarding journey

**Development handoff: user journey, flow and requirements, v12**
Supersedes v11. Built and validated against the clickable prototype in this repository (`npm run dev`).

## What changed since v11

| Area | v11 | v12 |
|---|---|---|
| Recommender (step 2) | Situation checklist mapped to products | Five quick profile questions that produce **three ready-made plans with prices** |
| Picker (step 3) | Pre-selected product tiles | **Plan picker** (Essential, Family or Everyday, Complete). The tile picker remains as "Build my own" |
| Motor | Lowest-ranked product in recommendations | **Optional add-on** to any plan, never built into a tier |
| Dependants | One situation checkbox | **Multi-select**: partner, children, parents or extended family, or "no one, just me" |
| Policy structure | Bundle of policies; documents generated per product | **One policy**: one policy number, one document. Each product is a **benefit** on it |
| Adding cover later | New policies added to the customer | **Endorsement** of the same policy (new version, same number) |
| Funeral cover | Policyholder only | **Extended-family funeral cover**: partner, children, parents, other relatives |
| New step 6b | — | **Who you're protecting**: family member details and beneficiary nomination, before payment |
| Contact capture | Phone and email | Adds **first name** |
| Waiting periods | Not in the journey | Shown wherever the claim promise appears; acknowledged at payment |
| Identity verification | ID and selfie | Adds an **age check** against the priced age range, with re-pricing or handoff |
| Messaging | Price-led | **Value-led**: outcomes, protection totals, per-day cost and safety nets (see section 6) |

Unchanged from v11 unless noted: section 1 (product context), section 2 (microinsurance constraints), step 10 (progressive KYC), section 5 (architecture), section 6 (compliance) and the open questions in section 7, which are carried forward with additions.

---

## 3. User journey overview

| Step | What happens | Key requirement |
|---|---|---|
| 1. Engage | Landing page and CTA. No data collected | Sets the speed expectation and the claim promise |
| 2. Profile questions | Travel, dependants, home, age and smoker, optional budget | No personal identifiers. "Build my own" skip link on every question |
| 3. Plan picker | Three priced plans, one recommended; add-ons for motor and family funeral cover | The plan price is the checkout price |
| 3b. Build my own | Product tile picker (for skippers and for adding benefits later) | Each selection becomes a benefit on one policy |
| 4. Per-product questions | Plan path: only details that can't be assumed (area, vehicle). Build-own path: full branches | No PII in any branch |
| 5. Quote | Protection summary, price per benefit and per family life, total, upsell | Price before any personal data; waiting periods visible |
| 6. Contact capture | First name, cell, email, POPIA consent, OTP | Enables save and resume |
| 6b. Who you're protecting | Family members' names and dates of birth; beneficiary | Runs whenever the funeral benefit is on a first application |
| 7. Payment and bind | Debit order (DebiCheck) or card; disclosure; waiting periods; confirmation | One provisional bind for the whole policy |
| 8. Identity verification | ID number, age check, selfie, Home Affairs match | Once per customer; re-price or hand off if age differs |
| 9. Policy issued | One policy number, one document; benefits, lives covered, share with family | Endorsements reuse the same number |
| 10. Progressive KYC | Unchanged from v11 | Event-triggered |

---

## 4. Screen-by-screen requirements (changed and new screens)

### 2. Profile questions

**Purpose.** Learn enough about the customer's situation to price three ready-made plans, without collecting personal identifiers.

**Screen elements**
- Bot opener on the first question.
- One question per screen, with a 5-segment progress bar:
  1. How do you usually get around? (Minibus taxi / Bus or train / My own car / I walk or get lifts)
  2. Who would need help if something happened to you? **Multi-select**: My partner / My children / My parents or extended family / No one, just me. "No one, just me" is exclusive: selecting it clears the others, and selecting another clears it.
  3. Where do you live? (A house / A flat, room or backroom / An informal home / In a family member's home)
  4. Age range (18–29, 30–39, 40–49, 50–59, 60–65) and smoked in the last 12 months (yes/no)
  5. Monthly budget, optional (Under R150 / R150–R300 / More than R300 / Not sure)
- Single-choice questions advance on tap. Multi-select and the age/smoker screen use Continue.
- Secondary link on every question: "I know what I want — build my own instead".

**Validation.** Each question needs an answer before continuing; budget may be "Not sure".

**Acceptance criteria**
- No name, ID number or contact detail is asked for.
- Re-tapping an already-selected answer advances, so pre-filled answers don't trap the user.
- Back navigation moves through the questions before leaving the step.

### 3. Plan picker

**Purpose.** Replace an open multi-select with three priced, ready-made plans.

**Plan construction** is a deterministic mapping from the profile (`src/data/plans.ts`). Amounts are placeholders for actuarial sign-off.

| Tier | Benefits |
|---|---|
| Essential | Funeral & Life, plus Medical Emergency (R25,000 for taxi, bus and train commuters, otherwise R10,000) |
| Family (or Everyday if no dependants) | Medical Emergency, Household (if the customer doesn't live in a family member's home) and Funeral & Life |
| Complete | All of Family plus Critical Illness, at higher amounts |

**Screen elements**
- Title personalised from the dependants answer (e.g. "Plans for you, your partner and your children").
- Chips summarising the profile, with an "Edit answers" link.
- **Motor add-on** (car owners only): No thanks / R25,000 / R50,000 / R100,000, each showing its monthly price. It applies to all three plans.
- **Family funeral cover** add-on (see step 3a). It applies to all three plans.
- Three plan cards, each showing:
  - an outcome line
  - the monthly price and the per-day cost
  - benefits written as plain outcomes (e.g. "R50,000 paid to your partner and children within 48 hours for funeral costs")
  - a waiting-period note
  - the CTA "Choose {plan}"
- Recommendation badge:
  - with no budget given, the middle tier
  - with a budget, the highest tier within it, including any add-ons
  - if even Essential is over budget, a warning says so
- On mobile the recommended plan appears first.
- Footer: month to month, cancel anytime, underwriter name. "Build my own instead" link.

**Rules**
- Every plan must sit within the life-class aggregate cap. Plan construction fails loudly if it doesn't.
- The plan card price must equal the quote and checkout price. Household price therefore does not vary by area; area is collected for the policy record only.
- Choosing a plan pre-fills every answer. Step 4 then asks only for steps with missing fields: household area and motor vehicle details.

### 3a. Family funeral cover (add-on, available on the plan picker and the quote)

**Purpose.** Cover the funerals of family members as well as the policyholder.

**Model.** Each family member is a separate life insured under the Family Funeral & Life benefit, with their own fixed funeral amount (`src/data/family.ts`).

| Who | Limit | Pricing |
|---|---|---|
| Partner | 1 | Flat rate |
| Children under 21 | All, as one group | Flat rate for the group |
| Parents and parents-in-law | Up to 4 | By age range (Under 65 / 65–74 / 75–84) |
| Other relatives | Up to 6 | By age range |

- One funeral amount applies to all adults: R10,000, R20,000 or R30,000.
- Children's payouts step down by age: under 6 up to R10,000; 6–13 up to R20,000; 14–21 up to R30,000. **These figures must be confirmed against the current legal limits.**
- Rows the customer marked as relying on them carry a "Relies on you" tag.
- The editor shows the monthly price per person and the running total.
- The quote breaks the funeral benefit down per person.

### 5. Quote

**Additions to v11**
- Above the price, a banner: "Up to R___ in payouts. Protecting {who}. Paid within 48 hours of a valid claim, once any waiting period has passed."
- Subtitle includes the per-day cost and "{n} benefits on one policy · cancel anytime".
- Each benefit line shows its waiting period. The funeral line expands to a per-person breakdown when family cover is added.
- Family funeral cover panel (step 3a) is available when Funeral & Life is selected.
- Eyebrow shows "Your {plan} plan". It changes to "based on {plan}" once the customer changes amounts or adds or removes a benefit.
- "Change amounts" opens every question, pre-filled. Upsell copy reads "Add more benefits — they go on the same policy".

### 6. Contact capture

Adds **First name** (required, autocomplete `given-name`). It is used to personalise the issued screen and messages. Everything else is unchanged from v11.

### 6b. Who you're protecting (new)

**Purpose.** Collect the details needed to cover family lives, and nominate a beneficiary so a claim is not delayed by an estate.

**When it runs.** Funeral & Life is on the application **and** either family cover was added, or this is the customer's first policy.

**Screen elements**
- **Family members** (if any). One card per person:
  - relationship (for parents and relatives), full name and date of birth (DD/MM/YYYY)
  - partner: one card
  - children: one card to start, "Add another child" up to 8, removable
- As soon as a card is complete and valid, it confirms: "{First name} is covered for R___". For children the amount reflects their age.
- **Beneficiary.** "If you pass away, who should we pay?"
  - Quick-pick chips for adult family members whose details are already complete.
  - Fields: full name, relationship, cell number.
  - "I'll add someone later" shows a warning that the payout may have to go through the estate, which can take months, with an "Add someone now" undo.
- Consent checkbox (family only): "I confirm these family members know they're being covered and that I may share their details for this policy."

**Validation**
- Names: first name and surname.
- Dates of birth: a real date, not in the future.
- Children: 21 or under.
- Partner: 18 or over.
- Parents and relatives: 84 or under, and their age must match the age range they were priced at. On a mismatch, an inline message offers "Update to {range} (price will change)", which re-prices that person.
- Beneficiary (unless deferred): name, relationship and a valid SA cell number.

**Acceptance criteria**
- No family member is on the policy without a name, date of birth and relationship.
- An age-range mismatch can never reach payment unresolved.
- A deferred beneficiary produces a reminder on the issued screen.

### 7. Payment and bind

**Additions to v11**
- **Safety-net chips** at the top: Month to month · {n}-day cooling-off · Cancel anytime.
- **"When your cover starts paying"** section, always visible (not collapsed). It lists each benefit's waiting period, plus the family-member waiting periods when relevant.
- **Claim promise**: "If something happens, one WhatsApp is all it takes. We pay valid claims within {n} hours, once the waiting period for that benefit has passed."
- **Protection line** above the CTA: "From today, {n} people are protected" (or "you're protected").
- Confirmation checkbox: "I've read and understood the policy summary **and waiting periods** for every benefit on my policy."
- Disclosure wording: "All benefits on your policy are underwritten by…". It stays a single static statement from one configurable source.
- When adding a benefit to an existing policy, the existing debit method is reused and shown; no new payment details are captured.

### 8. Identity verification

**Additions to v11**
- **Age check.** After a valid ID number is entered, the age is derived from the ID's date of birth and compared with the age range used for pricing.
  - **Matches:** continue to the selfie.
  - **Differs, within joining ages (18–65):** a "Let's update your price" screen shows the old price (struck through), the new price, "Your benefits stay the same. Nothing has been debited yet", the CTA "Continue at R___ a month" and a "Talk to us first" WhatsApp link. Continuing re-prices every age-rated benefit.
  - **Outside joining ages:** a handoff screen explains the age limits, confirms nothing has been debited, and offers a WhatsApp chat. There is no dead end.
- When a verified customer later adds a benefit, age ranges are pre-filled from their ID, not from memory.

### 9. Policy issued

Replaces the v11 per-product confirmation.

**Screen elements**
- **Headline:** "{First name}, your family is covered" (with family lives), "{First name}, you're covered", or "{First name}, your policy is updated" (endorsement).
- **Policy card:**
  - policy number
  - version badge (for endorsements)
  - single document status
  - benefits list with fixed amount, monthly premium (funeral includes family lives) and **dated waiting periods** (e.g. "Accidental death covered now · natural causes from 9 April 2027"); new benefits marked "New"
  - monthly total, debit method and first debit date
- **Who's covered for funerals:** the policyholder plus every family member, with relationship and payout.
- **Beneficiary reminder**, if none was nominated.
- **"Let your family know they're covered":** a pre-written WhatsApp message with the policy number and claims contact, plus "Share on WhatsApp" and "Copy message".
- How to claim (per benefit), help contacts, and "Add a benefit to this policy".
- CTAs: "Download my policy" and "Add a beneficiary".

**Rules**
- One policy document covers all benefits and lives. If generation fails, it is retried and the screen says the document is on its way. Cover is not blocked. *(This replaces v11's "each product's documents generated independently".)*
- An endorsement keeps the policy number, increments the version and issues an updated document.

---

## 5. Data model changes

- **Policy:** `number`, `version`, `startDate`, `docs`, `benefits[]` (product, sum assured, premium, addedOn), `family` (cover definition), `familyMonthly`, `members[]` (relationship, name, date of birth).
- **Customer:** adds `firstName`.
- **Application:**
  - `profile` (travel, dependants[], home, age band, smoker, budget, motor add-on)
  - `plan` (chosen tier and its amounts, used to detect customisation)
  - `onlySteps` (plan-path question filter)
  - `family`, `members`
- **Configuration** (`src/config.ts`) adds `promises` (claim payout hours, cooling-off days, customer count), `waiting` (per benefit, and family by age range) and `entryAge`. All are placeholders.

## 6. Messaging principles (new)

Position value before cost, without pressure:
- Lead with outcomes, not sums assured.
- Show the per-day cost alongside the monthly price.
- Show total protection and who it covers above the premium.
- Confirm each person by name.
- Keep safety nets next to the commit button.

Never use fear imagery, countdowns or false scarcity. Every promise must be true and shown with its qualifiers (waiting periods), in line with FSCA Treating Customers Fairly outcomes and advertising rules.

## 7. Open questions (carried forward, plus new)

**Needs underwriter or actuary confirmation**
- Classification of critical illness and medical emergency as life-class or non-life-class (carried forward).
- Motor and household benefit tiers under the defined-benefit constraint (carried forward).
- Plan amounts and prices, motor add-on tiers and family funeral rates (new).
- Waiting periods per benefit and for older family members (new).
- Whether each family member has their own life-class cap as a separate life insured (new).
- Maximum entry age for parents and relatives (prototype: 84) and for the policyholder (prototype: 65) (new).
- What happens to family members' cover when the policyholder dies: continuation, conversion or termination (new).

**Needs compliance confirmation**
- Whether recommending a plan with specific amounts is advice under FAIS, and the resulting record-of-advice obligations (new).
- Legal maximum funeral benefits for children by age (new).
- Disclosure of annual premium and benefit reviews, exclusions and ombud details at the point of sale (new).
- Consent requirements for covering adult family members (new).

**Needs a commercial or business decision**
- DebiCheck provider and identity-verification vendor (carried forward).
- Real values for the claim payout time, cooling-off period and customer count used in messaging (new).
- Lapse and grace-period journey for missed premiums (new; not yet designed).
- Language support beyond English, and an agent-assisted channel (new).
