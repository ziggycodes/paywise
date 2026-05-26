# PayWise

> *Your AI for money — the one that sabis your business.*

**MVP Plan v3 — Nigeria-first, built for Africa**

---

## 0. What Changed In This Refinement

The original plan was a strong skeleton. This version retools it around six realities the first draft missed:

- **Nigeria's tax law was rewritten in 2025 and took effect 1 January 2026.** Brackets, thresholds, exemptions, and even the agency name (FIRS → NRS) all moved. The estimation engine has to encode the Nigeria Tax Act 2025 specifically, not a generic Nigerian tax model.
- **There is already a direct competitor (KeepAm)** targeting the same audience with the same wedge. The differentiation cannot just be "tax for freelancers." It has to be the AI copilot experience, the WhatsApp surface, and the data moat built from continuous transaction streams.
- **Most Nigerian freelancers earn in a mix of NGN and USD.** FX, multi-currency accounting, and the worldwide-income rule for residents have to be in the MVP, not bolted on later.
- **Bank API coverage (Mono) is necessary but not sufficient.** SMS bank alerts, cash, POS receipts, and informal payments are how a huge share of income and expenses actually move. The ingestion layer needs more than one input.
- **WhatsApp is not a "later" channel for this audience.** It is the primary interface. The product should be reachable from WhatsApp on Day 1, even if the web app is the source of truth.
- **AI cost discipline is a Day 1 concern, not a Series A concern.** A naive single-model deployment can cost $2–3 per user per month and destroy unit economics. Multi-model routing, prompt caching, the Batch API, and a local merchant dictionary together cut this to ~$0.30–0.40 per user per month — the difference between a viable Nigerian fintech and a venture-only one.

---

## 1. Product Vision

### Positioning

**PayWise** is the AI financial copilot for Nigerian freelancers, creators, agencies, and small business owners — the one that tracks your money, estimates your tax, files what needs filing, and tells you the truth without judgment.

### The promise, in one sentence

> *"An AI that understands your business finances automatically — so you stop guessing, stop worrying, and start running your business like the egbon you are."*

### Who it's for (MVP)

- Freelancers and remote workers earning in NGN, USD, or both
- Content creators with multi-platform income (YouTube, TikTok, brand deals, Patreon)
- Agencies and consultancies under ₦100m annual turnover (the new small-company exemption band)
- Small business owners who currently use WhatsApp + a notebook for bookkeeping

### Who it's NOT for (MVP)

- Companies above ₦100m turnover (different tax regime — phase 2)
- Employers with payroll obligations (PAYE / employee tax — phase 3)
- Businesses needing full GAAP-compliant accounting (Tyms, QuickBooks territory)

---

## 2. Core MVP Philosophy

### What we ARE building

- AI-powered financial visibility across NGN and USD accounts
- Smart, locally-aware transaction categorization (Bolt, Glovo, Chowdeck, Spotify NG, Showmax, MTN, Airtel — these need to be recognized natively)
- Tax estimation engine encoding Nigeria Tax Act 2025 (PIT brackets, ₦800k threshold, small-company exemptions, VAT, WHT credits, residency rules)
- Expense tracking from bank sync + SMS alerts + manual + receipt photos
- Invoice generation with optional WHT and VAT lines
- Conversational AI assistant accessible on web and WhatsApp
- Notifications via WhatsApp, email, and in-app

### What we are NOT building yet

- Full double-entry accounting
- PAYE / payroll for employees
- Direct NRS filing integration (export to PDF/CSV is fine for MVP)
- Multi-country tax engine (architected for it, not shipping it)
- Banking infrastructure of our own

**Discipline:** keep the MVP narrow and excellent. Every feature must reduce a freelancer's monthly tax-related anxiety in a way they can feel in week one.

---

## 3. Tech Stack — Refined

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion for micro-interactions only

### Backend
- Supabase (Postgres + Auth + Storage + Edge Functions + Row-Level Security)
- PostgreSQL with strict RLS — every row scoped to `user_id`

### AI
- **Anthropic Claude** as the primary AI provider — see §7 for the detailed model routing strategy
- OpenAI as a fallback / for specific tasks (Whisper for voice transcription)
- A small embedding-based classifier for common Nigerian merchants — reduces LLM calls once you have data

### Banking / Open Finance
- Mono (primary — Nigerian banks, also covers Ghana and Kenya, useful for expansion)
- Okra as fallback / secondary provider for redundancy
- Stitch as the path to South Africa later

### Payments (collecting from users for subscriptions)
- Paystack — primary, NGN subscriptions
- Flutterwave — secondary, especially for diaspora users paying in USD
- Stripe — only for the diaspora segment; not the default

### Messaging
- WhatsApp Business Cloud API (Meta) — first-class channel from Day 1
- Termii or similar for SMS fallback and OTP
- Resend for transactional email

### Background jobs
- Trigger.dev or Inngest — event-driven, idempotent workers

### Hosting & Ops
- Vercel (frontend + serverless)
- Supabase (DB + storage)
- Sentry (errors)
- PostHog (product analytics + feature flags + AI cost tracking)

### Compliance & Trust
- Register with the Nigeria Data Protection Commission (NDPC) before launch
- Publish a Nigeria-localized privacy policy in plain English and Pidgin
- SOC 2-aligned controls from Day 1, even if certification comes later (it matters for B2B/agency customers)

---

## 4. MVP Features

### Feature 1 — Authentication & Onboarding

**Goals.** Get the user from sign-up to first "aha moment" (seeing their estimated tax on real transactions) in under 7 minutes.

**Sign-up options**
- Email + password
- Google OAuth
- Phone + OTP (high adoption among Nigerian users who don't use email as primary)

**Onboarding wizard — refined questions**
- What do you do? (Freelancer / Creator / Agency / Small business owner / Mixed)
- How do you usually get paid? (Nigerian bank transfer / USD via Wise, Payoneer, Deel / Crypto / Cash / Mixed) — this single answer drives the FX and worldwide-income logic
- Roughly how much did you earn last year? (Bands: <₦800k / ₦800k–3m / ₦3m–12m / ₦12m–50m / >₦50m) — used to pre-select the right tax bracket presentation, not to gate features
- Do you have a CAC-registered business? (Yes — RC/BN number / No, I operate as an individual)
- Do you have a TIN? (Yes / No / I'm not sure) — if "not sure," we explain that with BVN/NIN it's likely auto-generated and offer to help look it up
- Are you VAT-registered? (default No — most won't be, threshold is ₦100m turnover)
- Connect your primary bank? (Mono flow, with skip option)
- Connect WhatsApp for daily summaries? (high-conversion ask — frame it as a benefit, not a permission)

**UX requirements**
- Calm fintech aesthetic — dark/light mode, mobile-first (most Nigerians will install the PWA on their phone)
- Progress indicator, every step skippable
- Onboarding completion telemetry — track drop-off step by step in PostHog

---

### Feature 2 — Financial Dashboard

**Hero widgets (the 5 things that should always be visible)**
- Income this month (NGN-normalized, with FX-source breakdown visible on hover)
- Deductible expenses captured this month
- Estimated tax for the year so far (with bracket position visualized)
- Tax-free runway — "₦X left before you cross the ₦800,000 threshold" — a uniquely motivating Nigerian framing
- Next deadline — countdown to 31 March filing, or to the next month-end if VAT-registered

**Secondary widgets**
- Recent transactions with confidence-scored categories
- Top expense categories vs. last month
- WHT credit balance — money clients withheld that the user can claim back
- USD vs NGN income split (for users with foreign income)

**UX direction**
- Feels conversational, not spreadsheet-y
- Empty states do real work — "Connect your bank to see your first tax estimate" with a one-tap action
- Numbers always rounded; precision available on tap

---

### Feature 3 — Multi-Source Transaction Ingestion

**This is the biggest change from v1.** Mono alone misses too much.

**Input channels**
- **Mono (primary)** — Nigerian bank accounts via the standard Open Banking flow
- **Bank SMS parsing** — user forwards their bank alerts to a dedicated PayWise number (or grants SMS-read permission in the Android app phase); we parse amount, merchant, account. Critical because (a) Mono coverage isn't 100% across banks, (b) many transactions don't appear in API feeds for hours, (c) SMS is instant
- **Receipt photo upload** — user snaps a photo of a POS receipt or a market purchase; OCR + AI extracts amount, vendor, date, suggests category
- **Manual entry** — fast-path form, less than 4 seconds per entry, voice-input enabled
- **WhatsApp forward** — "₦15,000 for diesel" sent to the bot logs an expense in one line
- **Stripe / Wise / Payoneer / Deel CSV imports** — for USD-earning users

**Transaction fields**
`amount`, `currency` (NGN, USD, GBP, EUR, etc.), `fx_rate_used`, `fx_rate_source` (CBN, market, manual), `merchant`, `merchant_normalized`, `category`, `category_confidence`, `date`, `transaction_type` (income / expense / transfer), `source` (mono / sms / manual / receipt / whatsapp / csv), `source_account_id`, `tax_relevant`, `wht_deducted`, `vat_charged`, `notes`

---

### Feature 4 — AI Transaction Categorization

**Local merchant intelligence.** Pre-seed the categorizer with a Nigerian merchant dictionary: Bolt, inDrive, Uber, Chowdeck, Jumia Food, Glovo, Konga, Jumia, MTN, Airtel, Glo, 9mobile, GOtv, DStv, Showmax, Spotify NG, Apple, Adobe, Notion, Figma, OpenAI, Vercel, AWS, common co-working spaces (CcHub, Workbay, Capital Square, Workstation), known FX platforms (Wise, Payoneer, Deel, Remitano), and key banks. This dramatically improves Day 1 categorization accuracy before the user has corrected anything.

**Categories (Nigeria-tuned)**

*Income:*
- Client payment (NGN)
- Client payment (foreign)
- Creator payout (YouTube, TikTok, Patreon, Substack)
- Affiliate / referral
- Salary (if user is also employed)
- Investment income
- Other

*Deductible expenses (mapped to NTA 2025 allowable categories):*
- Internet & data subscriptions
- Software & SaaS subscriptions
- Equipment & hardware
- Office rent / co-working
- Transportation (for work)
- Professional development & training
- Marketing & advertising
- Bank charges & payment platform fees
- Professional services (legal, accounting)
- Phone & communications

*Non-deductible / personal:*
- Personal food & groceries
- Personal entertainment
- Family transfers
- Loan repayments

**AI workflow**
1. **Cheap path first:** if the merchant matches the local dictionary with high confidence, skip the LLM call entirely. Use embeddings to match near-duplicates ("BOLT.EU" vs "BOLT TECHNOLOGY").
2. If unknown or low confidence, call **Claude Haiku 4.5** with structured output: `{ category, confidence, tax_relevant, reasoning }`
3. Store confidence; surface low-confidence items in a "Quick review" inbox the user can clear in batches
4. Every user correction feeds a per-user preference model — this is the moat

---

### Feature 5 — Tax Estimation Engine (Nigeria Tax Act 2025)

**Brackets to encode (PIT, effective 1 January 2026)**

| Annual taxable income (₦) | Rate |
| --- | --- |
| 0 – 800,000 | 0% |
| 800,001 – 3,000,000 | 15% |
| 3,000,001 – 12,000,000 | 18% |
| 12,000,001 – 25,000,000 | 21% |
| 25,000,001 – 50,000,000 | 23% |
| Above 50,000,000 | 25% |

**Other rules the engine must handle**
- **Rent relief:** 20% of annual rent, up to a ₦500,000 cap, deductible from taxable income
- **Small-company exemption:** if user has a CAC-registered company with turnover ≤ ₦100m and fixed assets ≤ ₦250m, exempt from CIT, CGT, and Development Levy — surface this prominently as good news
- **VAT:** 7.5%, applies only if turnover crosses ₦100m or user voluntarily registers — for most freelancers this is OFF by default
- **Withholding Tax (WHT):** track WHT deducted by clients (usually 5% or 10%) as a credit against final tax liability
- **Worldwide income for residents:** USD income converted at the official CBN rate on transaction date — store the rate used, never re-derive at filing time
- **Residency:** track days in Nigeria; alert if the user crosses the 183-day threshold (matters for diaspora users)
- **Filing deadline:** 31 March of the following year for individuals — countdown widget surfaces from January

**Dashboard messages, refined**
- "Estimated tax for 2026: ₦142,000 — you're in the 15% bracket"
- "You have ₦340,000 of tax-free room left this year"
- "Your business expenses have lowered your taxable income by ₦620,000 — that's about ₦93,000 saved in tax"
- "₦45,000 in WHT was withheld by your clients this year. Claim it as a credit."
- "Filing deadline: 31 March 2027 — 64 days away"

**Critical disclaimers (always visible)**
- "Estimated values only. PayWise is not a registered tax agent."
- "Confirm with a tax professional before filing."
- "Your data is never shared with NRS unless you explicitly export and submit it yourself."

---

### Feature 6 — AI Tax Assistant (Web + WhatsApp)

**Channels**
- In-app chat (web/PWA)
- WhatsApp — same brain, accessed by sending a message to the PayWise WhatsApp number

**Language & register**
- Understands and responds in English and Pidgin
- *Stretch:* Yoruba, Hausa, Igbo for common queries (post-MVP, but design the prompt layer to swap)
- Accepts voice notes — transcribe with Whisper, respond in text + optional voice reply

**Example prompts it must handle well**
- "Wetin be my tax this month?"
- "Can I deduct my MTN bill?"
- "How much should I keep for tax from this ₦500k client payment?"
- "My client just paid me $1,200 via Wise — what's that in Naira and is it taxable?"
- "Show me everything I spent on diesel this year"
- "Why is my tax higher than last month?"
- "Help me write an invoice for ABC Ltd, ₦750,000, with 5% WHT"

**Assistant context (what it can see)**
- All the user's transactions and categories
- Current estimated tax + bracket position
- Invoices issued and their status
- Connected accounts and currencies
- User's stated business type from onboarding

**Safety rails**
- Never fabricate a tax rule — if unsure, say so and link to the NRS / NTA 2025 source
- Never promise a refund or a specific filing outcome
- Always end tax-advice answers with the "estimated only" disclaimer

---

### Feature 7 — Invoice Generator

**Fields**
- Client name & address
- Invoice number (auto-incremented per user)
- Currency (NGN, USD, GBP, EUR)
- Line items with quantity and rate
- VAT line (toggle on/off; defaults to off unless user is VAT-registered)
- WHT line (toggle on/off; defaults to off but suggested for B2B Nigerian clients at 5–10%)
- Due date
- Payment instructions (bank details, USD wire info, Paystack payment link)
- Notes

**Outputs**
- Branded PDF download
- Shareable payment link (Paystack-powered if NGN, Flutterwave for USD)
- WhatsApp share — one tap to forward the invoice to the client
- Automatic income entry once marked paid — feeds back into the tax engine

---

### Feature 8 — Notifications & Reminders

**Channel hierarchy**
- WhatsApp (default for daily/weekly summaries — opens at 90%+ vs. 20% for email)
- Email (for formal documents like monthly statements)
- In-app (for transactional)

**Notification types**
- Daily WhatsApp summary at 8pm — "Today: ₦47k in, ₦12k out, tax estimate up ₦4k"
- Weekly digest — top expenses, biggest income source, tax position
- Income anomaly — "₦2.4m came in from a new client today — want me to categorize and set aside tax?"
- Expense anomaly — "You spent 3x more on transportation this week than usual"
- Tax milestone — "You just crossed the ₦800,000 tax-free threshold"
- Filing reminders — 60, 30, 14, 7, 1 days before 31 March
- WHT reminder — "You have ₦62k in WHT credits to claim — collect the receipts from your clients"

---

## 5. Database Architecture

Core tables (Postgres via Supabase, all with strict RLS on `user_id`):

### users
`id, email, phone, full_name, onboarding_completed, default_currency, tax_residency, has_cac, rc_number (nullable), tin (nullable), has_bvn_verified, locale (en/pidgin/yo/ha/ig)`

### organizations
`id, owner_id, business_name, cac_type (RC/BN), annual_turnover_estimate, is_vat_registered, is_small_company`

### bank_accounts
`id, user_id, provider (mono/okra/manual), provider_account_id, bank_name, account_name, account_type, currency, last_synced_at`

### transactions
`id, user_id, account_id (nullable for manual), amount, currency, amount_ngn, fx_rate, fx_rate_source, merchant_raw, merchant_normalized, category, category_confidence, ai_categorized (bool), ai_model_used (text), user_corrected (bool), date, transaction_type, source (mono/sms/manual/receipt/whatsapp/csv), source_metadata (jsonb), tax_relevant, wht_deducted, vat_charged, notes, created_at`

### merchant_dictionary (shared, read-only for users)
`id, merchant_normalized, aliases (text[]), default_category, country, tax_relevant_default, is_subscription`

### user_merchant_preferences
`user_id, merchant_normalized, preferred_category, tax_relevant (overrides default)`

### invoices
`id, user_id, invoice_number, client_name, client_email, currency, subtotal, vat_amount, wht_amount, total, status (draft/sent/paid/overdue), due_date, paid_date, payment_link, pdf_url`

### tax_estimates
`id, user_id, period (month/ytd), period_start, period_end, gross_income_ngn, deductible_expenses_ngn, taxable_income_ngn, estimated_pit_ngn, bracket, wht_credit_ngn, vat_owed_ngn, rule_pack_version, computed_at`

### ai_conversations
`id, user_id, channel (web/whatsapp), thread_id, role (user/assistant), content, context_snapshot (jsonb), model_used (text), input_tokens, output_tokens, cached_tokens, cost_usd, created_at`

### ai_cost_ledger
`id, user_id, model, operation (categorize/assistant/ocr/anomaly), input_tokens, output_tokens, cached_tokens, batch (bool), cost_usd, created_at` — **critical for $/user/month tracking**

### notifications
`id, user_id, channel, type, payload, status, scheduled_for, sent_at`

### audit_log
`id, user_id, action, entity_type, entity_id, before, after, ip, user_agent, created_at` — for compliance and debugging

---

## 6. Architecture Principles

### Event-driven, idempotent
Every external input is an event. Workers are idempotent — re-running a job never duplicates a transaction.

**Canonical flow**
1. User connects bank → Mono webhook received
2. → `transaction.sync` job enqueued
3. → for each new transaction: `transaction.ingest` event
4. → `transaction.categorize` job (dictionary lookup, then LLM if needed)
5. → `transaction.tax_recalculate` job
6. → `user.notify` if anomaly threshold crossed
7. → dashboard updates via Supabase realtime

### Country-agnostic tax engine
Tax rules live in a pluggable module. The MVP ships one rule pack: `ng-2026`. Adding Ghana later is a new rule pack, not a rewrite. Every transaction stores the `rule_pack_version` it was estimated under, so historical numbers don't shift when laws change.

### Multi-currency from Day 1
Every monetary value carries `(amount, currency, fx_rate_to_ngn, fx_rate_source, fx_rate_date)`. The display layer normalizes; the data layer never loses the original.

### Provider abstraction
`BankProvider`, `PaymentProvider`, `MessagingProvider`, `AIProvider` interfaces. Mono today, Okra/Stitch tomorrow — same interface. Claude today, room for fallback providers — same interface.

---

## 7. AI System Design — Model Selection & Cost Optimization

This section is the difference between a viable Nigerian fintech and a venture-only one. Read it twice.

### 7.1 The model lineup PayWise will use

PayWise uses **Anthropic Claude** as the primary AI provider. As of mid-2026, the three production models are:

| Model | Input $/MTok | Output $/MTok | With Batch API | With cache hit |
| --- | --- | --- | --- | --- |
| Claude Haiku 4.5 | $1.00 | $5.00 | $0.50 / $2.50 | $0.10 / $5.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $1.50 / $7.50 | $0.30 / $15.00 |
| Claude Opus 4.7 | $5.00 | $25.00 | $2.50 / $12.50 | $0.50 / $25.00 |

All models charge output at 5× input. Prompt caching cuts cached input by 90%. Batch processing cuts everything by 50%. These two levers are non-optional for PayWise economics.

> **Note on Opus 4.7:** it ships with a new tokenizer that can produce up to 35% more tokens for the same input compared to Opus 4.6. Per-token prices are unchanged, but effective cost per request can be higher. Benchmark before standardizing.

### 7.2 Which model for which job

| Operation | Model | Why | Channel |
| --- | --- | --- | --- |
| Transaction categorization | **Haiku 4.5** | High volume, structured output, classification — textbook Haiku territory | Batch API where latency allows |
| Receipt OCR + extraction | **Haiku 4.5** | Vision + structured output, low complexity | Real-time |
| Anomaly summaries ("you spent 3x more…") | **Haiku 4.5** | Simple narrative generation, short outputs | Batch (daily/weekly) |
| Daily/weekly WhatsApp digest | **Haiku 4.5** | Templated summarization | Batch (scheduled) |
| Conversational assistant (chat + WhatsApp) | **Sonnet 4.6** | Nuance, Pidgin handling, reasoning over user's financial context | Real-time, prompt-cached |
| Tax estimation explanations ("why is my tax this high?") | **Sonnet 4.6** | Multi-step reasoning, needs to walk through brackets and deductions | Real-time |
| Invoice copy generation | **Sonnet 4.6** | Quality matters; low volume | Real-time |
| Complex edge cases (multi-currency boundary, ambiguous deductions, "what should I do?") | **Opus 4.7** | Reserved fallback — only when Sonnet confidence falls below threshold | Real-time, rare |

**The routing rule:** start with the cheapest model that clears the quality bar. Escalate only on signal (low confidence score, user clicks "this is wrong," or a confidence-routing classifier flags it).

### 7.3 Prompt caching — implementation

Prompt caching is the single biggest cost lever. **Turn it on Day 1.** For every Claude API call, mark the portions of the prompt that don't change between calls as cacheable. After the first call, subsequent calls within the cache TTL (5 minutes default, 1 hour with extended caching) read from cache at 10% of normal input cost.

**What to cache for PayWise:**

1. **System prompts** — every Claude call should have a stable, lengthy system prompt covering PayWise persona, output format, safety rails. Cache it.
2. **Category taxonomy** — the full list of income/expense categories with descriptions. Cache it.
3. **Tax rule context** — the NTA 2025 rule pack summary that the assistant uses. Cache it.
4. **The user's recent transaction context** — for assistant chats, the last N transactions and the user's tax profile. Cache for the duration of the chat session.
5. **Merchant dictionary subset** — when categorizing in a batch, cache the dictionary block.

**Code shape (TypeScript, using the Anthropic SDK):**

```typescript
// services/ai/claude.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function categorizeTransaction(tx: TransactionPayload) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: [
      {
        type: "text",
        text: PAYWISE_CATEGORIZER_SYSTEM_PROMPT, // long, stable
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: CATEGORY_TAXONOMY_BLOCK, // long, stable
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: NIGERIAN_MERCHANT_DICTIONARY_BLOCK, // long, stable
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Categorize this transaction:\n${JSON.stringify(tx)}`, // small, variable
      },
    ],
  });
  return response;
}
```

For the conversational assistant, the user's transaction history goes in a separate cached block per session:

```typescript
export async function assistantTurn(
  userId: string,
  sessionId: string,
  message: string,
  userContextBlock: string, // recent txs, tax profile — same within a session
) {
  return client.messages.create({
    model: "claude-sonnet-4-6-20250929", // confirm model string with Anthropic docs
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: PAYWISE_ASSISTANT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: NTA_2025_TAX_RULES_BLOCK,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: userContextBlock, // unique per user but stable within session
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: await loadConversationHistory(sessionId).then(h => [
      ...h,
      { role: "user", content: message },
    ]),
  });
}
```

Verify the exact model strings against the Anthropic docs at deploy time — model IDs evolve.

### 7.4 The Batch API — implementation

The Batch API processes requests asynchronously with results returned within 24 hours, at 50% off standard rates. Use it for everything that isn't real-time.

**What to batch for PayWise:**

- **Nightly transaction categorization runs** — historical backfill when a user connects a new bank, or a nightly re-categorization pass for low-confidence items
- **Weekly anomaly detection sweeps** — generate the "you spent 3x more on transport" narratives once a week
- **Daily WhatsApp digest generation** — assemble all users' 8pm summaries in a single batch run at 6pm
- **Monthly statement generation** — natural-language summaries of the user's month

**Operationally:** maintain two queues in Trigger.dev — `ai-realtime` (immediate, expensive) and `ai-batch` (queued, 50% cheaper). The default for any categorization that isn't blocking a UI render goes to `ai-batch`.

### 7.5 The dictionary-first pipeline

Before any LLM call for categorization, check the local merchant dictionary. This is where 60–80% of categorization cost disappears.

**Pipeline:**

1. Normalize merchant string (lowercase, strip special chars, common suffix removal — "BOLT.EU" → "bolt", "MTN VTU" → "mtn")
2. Exact match against `merchant_dictionary` → use the dictionary category, skip LLM
3. Embedding-based nearest-neighbor match (pgvector in Postgres) → if similarity > 0.92, use the matched dictionary category, skip LLM
4. Check `user_merchant_preferences` → if the user has corrected this merchant before, use their preference
5. Only now call Haiku 4.5 with structured output

**Seed the dictionary on Day 1** with at least 500 Nigerian merchants. Grow it from user corrections.

### 7.6 Cost monitoring — non-negotiable instrumentation

The `ai_cost_ledger` table records every Claude API call with `model`, `operation`, `input_tokens`, `output_tokens`, `cached_tokens`, `batch` (bool), and computed `cost_usd`. Pipe this to PostHog as an event per call.

**The dashboard the engineering team checks daily:**
- **$/active user/month** — target: under $0.50 at MVP scale, under $0.30 at scale
- **Cache hit rate by operation** — target: 70%+ on assistant turns within sessions, 50%+ on categorization
- **Batch utilization** — target: 80%+ of categorization calls go through batch
- **Dictionary hit rate** — target: 70%+ after 3 months of data

**Alerting:** if $/user/day exceeds 2× the rolling 7-day average, page on-call. AI products that don't watch this metric get expensive surprises.

### 7.7 Structured outputs are non-negotiable

Every AI call returns validated JSON. No free-text categorization. Use Anthropic's tool-use feature or strict JSON-mode prompting.

```typescript
const CATEGORIZE_TOOL = {
  name: "categorize_transaction",
  description: "Categorize a transaction for tax purposes",
  input_schema: {
    type: "object",
    properties: {
      category: { type: "string", enum: ALL_CATEGORIES },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      tax_relevant: { type: "boolean" },
      reasoning: { type: "string", maxLength: 200 },
    },
    required: ["category", "confidence", "tax_relevant", "reasoning"],
  },
};
```

Validate every response against the schema. Reject malformed responses and retry (rare with structured outputs, but always possible).

### 7.8 The data moat

Every user correction is gold. Over months: a Nigerian-merchant-and-category model that no global incumbent has. Treat the corrections table as the most valuable asset in the company. Feed it back into:
- The merchant dictionary (corrections that 10+ users agree on become defaults)
- Per-user preferences (immediate)
- A future fine-tuned classifier (post-MVP, when you have ~100k labeled corrections)

### 7.9 Unit economics — what good looks like

For a typical active PayWise user generating ~300 transactions/month and ~20 assistant turns/month:

| Layer | Cost/user/month |
| --- | --- |
| Categorization (after dictionary hits + caching + batch) | ~$0.05 |
| Assistant turns (Sonnet 4.6 with caching) | ~$0.20–0.30 |
| Anomaly + digests (Haiku 4.5, batch) | ~$0.03 |
| OCR for receipts (variable) | ~$0.02 |
| **Total** | **~$0.30–0.40** |

At the Pro tier of ₦4,500 (~$3 USD), that's a 10×+ gross margin on AI cost — healthy and defensible.

Without the dictionary + caching + routing + batch, the same user easily costs $2–3. **That delta is the entire business.**

### 7.10 Model selection for the founders/engineers building PayWise

Separate from the models the *app* uses, here's what the team should use while building:

- **Planning & strategy conversations on claude.ai** → Claude Opus 4.7 (this is the planning work; cost is negligible per conversation)
- **Writing code with Cursor or Claude Code** → Sonnet 4.6 as default; switch to Opus 4.7 for genuinely hard architecture moments (tax rule-pack design, event-driven ingestion debug, multi-currency edge cases)
- **Document refinement (like this plan)** → Opus 4.7

### 7.11 Action checklist for AI implementation

- [ ] Set up Anthropic SDK and store API key in Supabase Vault (never in repo)
- [ ] Create `services/ai/claude.ts` with a single client and provider-abstraction interface
- [ ] Implement prompt caching on system prompts + category taxonomy + merchant dictionary
- [ ] Implement prompt caching on per-session user context for the assistant
- [ ] Set up the `ai-batch` queue in Trigger.dev for non-realtime categorization
- [ ] Migrate nightly categorization, weekly anomaly sweeps, and daily digests to Batch API
- [ ] Seed `merchant_dictionary` with 500+ Nigerian merchants before launch
- [ ] Enable pgvector and implement embedding-based merchant matching
- [ ] Define all AI calls via tool-use schemas (structured outputs)
- [ ] Create `ai_cost_ledger` table and log every call
- [ ] Build the AI cost dashboard in PostHog ($/user/month, cache hit rate, batch utilization, dictionary hit rate)
- [ ] Set alerting on $/user/day anomalies
- [ ] Build a model-router that escalates from Haiku → Sonnet → Opus based on confidence signals

---

## 8. UI/UX Principles

### Feel
- Intelligent — surfaces insights without being asked
- Calm — never alarming, even when delivering bad news
- Premium — Naira fintech can look beautiful; aim higher than the local average
- Conversational — the assistant is a first-class surface, not buried
- Simple — every screen does one thing

### Avoid
- Spreadsheet aesthetics
- Accounting jargon (no "debits/credits/journals" anywhere user-facing)
- Western abstractions that don't translate (no "401(k)" or "1099")
- Stock-photo Africans on the landing page

### Mobile-first, PWA-friendly
Most users will discover PayWise on Twitter/WhatsApp on their phone. The web experience must be installable and offline-tolerant. Native iOS/Android can come in phase 5.

### Design inspiration
- Linear (clarity)
- Mercury (trust)
- Ramp (numbers without fear)
- Cleva and Grey (local fintech aesthetic done well)
- Notion AI (assistant pattern)

---

## 9. Security, Trust & Compliance

### Must-haves at launch
- NDPC (Nigeria Data Protection Commission) registration as a data controller
- Privacy policy and terms reviewed by a Nigerian lawyer familiar with the NDPA 2023
- Row-level security on every table
- Secrets in a vault (Supabase Vault, Doppler, or AWS KMS) — never in code or `.env` in repo
- Webhook signature validation on every external callback (Mono, Paystack, Meta)
- Audit log for every financial-relevant action
- HTTPS everywhere, HSTS, secure cookies, CSRF protection
- MFA available for users (TOTP and WhatsApp OTP)
- Encryption at rest (Supabase default) and in transit

### Trust signals on the marketing site
- Founder photos and bios — Nigerians want to know who's behind a money app
- "We are NDPC-registered" badge
- "We never share your data with the NRS unless you ask us to" — explicit, repeated
- Testimonials from real, named Nigerian creators (paid early users)
- Naira pricing front and center

---

## 10. Build Phases

### Phase 1 — Foundation (Weeks 1–2)
- Next.js + Supabase scaffold
- Auth (email + phone OTP + Google)
- Onboarding wizard
- Empty dashboard with hero widget shells
- Database schema migrations (including `ai_cost_ledger`)
- Anthropic SDK integration with prompt caching setup
- NDPC registration kicked off

### Phase 2 — Ingestion (Weeks 3–4)
- Mono integration + webhook handler
- Manual transaction entry (fast-path)
- Receipt photo OCR pipeline (Claude Haiku 4.5 vision)
- CSV import for Wise/Payoneer/Deel
- Transaction list UI with categories

### Phase 3 — Intelligence (Weeks 5–6)
- Local merchant dictionary (seed with 500+ Nigerian merchants)
- pgvector embedding-based merchant matching
- LLM categorization with structured outputs on Haiku 4.5
- Batch API queue for nightly categorization
- User correction loop + preference learning
- Tax estimation engine (NTA 2026 rule pack)
- Dashboard widgets become live

### Phase 4 — Assistant & Workflows (Weeks 7–8)
- AI assistant on web (Sonnet 4.6, English + Pidgin) with session-level prompt caching
- Invoice generator with WHT/VAT toggles + PDF + payment link
- Notification system (in-app + email)
- WhatsApp Business setup, opt-in flow
- AI cost dashboard live in PostHog

### Phase 5 — WhatsApp & SMS (Weeks 9–10)
- WhatsApp assistant (same brain, conversational interface)
- Daily/weekly summaries on WhatsApp (Haiku 4.5, batched)
- SMS bank alert parsing — start with the top 6 Nigerian banks (GTBank, Access, Zenith, UBA, First Bank, Wema)
- Voice note ingestion ("₦15k for diesel" via voice)

### Phase 6 — Polish & Launch (Weeks 11–12)
- Performance pass (sub-1s dashboard load on 3G)
- Mobile PWA install prompts
- Onboarding flow optimization based on PostHog drop-off data
- AI cost optimization pass — verify cache hit rates, batch utilization, dictionary hit rates against targets
- Closed beta with 50–100 hand-picked Nigerian creators/freelancers
- Pricing live (Paystack subscriptions)
- Public launch

---

## 11. Cursor / AI-Coding Guidelines

### Demand
- Modular, typed code — no `any`
- Reusable UI components in `/components/ui`
- Service layer separated from UI
- Idempotent jobs with explicit input/output types
- Tests for tax engine (this is the one area where bugs are unforgivable)
- Tests for AI cost accounting (cache hit detection, batch flagging)

### Refuse
- Giant files (>400 lines is a smell)
- Business logic inside React components
- Tax math anywhere except `/services/tax/*`
- Direct Anthropic/OpenAI calls outside `/services/ai/*` (so we can swap models and centralize cost logging)
- Any AI call that doesn't go through the cost ledger

---

## 12. Folder Structure

```
/app                                  Next.js routes
/components                           UI primitives and feature components
/lib                                  shared utilities, types, constants
/services
  /tax
    /rule-packs
      /ng-2026                        Nigeria 2026 rule pack
  /ai
    claude.ts                         Anthropic SDK wrapper
    routing.ts                        model-router (Haiku → Sonnet → Opus)
    caching.ts                        prompt-cache config blocks
    cost-ledger.ts                    cost logging
    prompts/                          stable cacheable prompts
  /banking                            Mono/Okra adapters
  /messaging                          WhatsApp/SMS/email adapters
  /invoicing
/hooks                                React hooks
/jobs                                 Trigger.dev / Inngest workers
  ai-realtime/
  ai-batch/
/api                                  Next.js route handlers / webhooks
/data
  /merchants                          seed merchant dictionary
/supabase
  /migrations                         DB migrations
```

---

## 13. Pricing & Go-to-Market

### Pricing (NGN-first)
- **Free** — connect 1 bank, up to 50 transactions/month, manual + 5 AI categorizations/day, basic tax estimate
- **Pro** — ₦4,500/month or ₦45,000/year (~17% annual discount): unlimited transactions, unlimited AI, WhatsApp assistant, invoice generator, multi-currency, WHT tracking
- **Agency** — ₦12,000/month: everything in Pro + multi-business support + accountant export packs (PDF + CSV ready for filing)

*Pricing logic:* Pro pricing is roughly the cost of a Showmax subscription. Cheap enough to not need a meeting, expensive enough to fund proper AI inference. Annual is the conversion lever.

### Distribution channels
- **Twitter/X** — the Nigerian tech community lives here. Founder presence is non-optional.
- **WhatsApp groups** — partner with creator collectives and freelancer communities
- **Tech media** — TechCabal, Techpoint, BusinessDay tech section, Benjamindada
- **YouTube** — short founder-explainer + tutorials in English and Pidgin
- **Referral program** — 1 month free for every paid referral, both sides
- **Creator partnerships** — pay 5–10 mid-tier Nigerian creators (50k–500k followers) to share their honest experience after 30 days

### Launch sequence
1. Closed beta: 50–100 hand-picked users from Twitter, paid via gift cards, full feedback loop
2. Soft launch: invite-only waitlist, capped daily new sign-ups for the first 2 weeks (manages support load and AI costs)
3. Public launch: Product Hunt, Twitter thread, founder podcast circuit (CCMag, Techpoint Build, TechCabal podcast)

---

## 14. Competitive Positioning

### Who else is in this space
- **KeepAm** — closest competitor, tax-compliance-first framing, less AI-native
- **Tyms** — bookkeeping/accounting for small businesses, more accountant-facing
- **QuickBooks / Wave / Xero** — international, expensive, not Nigeria-aware
- **Notebooks and WhatsApp accountants** — the actual incumbent for 90% of the target market

### PayWise's wedge
- The conversational AI surface (WhatsApp + Pidgin + voice notes) — none of the above do this credibly
- Multi-source ingestion (bank + SMS + receipts + manual + WhatsApp) — KeepAm leans on user input; we close the gap
- Anti-anxiety framing — "the AI that sabis your money, not your auditor" — emotional positioning the competition doesn't own
- Built for the new tax law — clean-room implementation of NTA 2025, no legacy assumptions
- Sustainable unit economics via aggressive AI cost optimization — most competitors will burn through margin trying to match the AI experience

---

## 15. Expansion: What "Africa Later" Means Architecturally

"Build for Nigeria, expand later" is only credible if the expansion is a configuration change, not a rewrite. Lock these in from Day 1:

- Tax engine is a pluggable rule pack — adding Ghana is shipping `/services/tax/rule-packs/gh-2026`, not refactoring
- Banking provider is an interface — Mono in Nigeria, Mono or Stitch in Kenya, Stitch in South Africa
- Currency is never assumed to be NGN — the display layer chooses; the data layer stores all currencies natively
- Locale is a user property — copy lives in translation files, not in components
- Merchant dictionary is country-scoped — Nigerian merchants tagged `country=NG`; we'll seed Kenyan ones for KE
- Messaging provider abstracts WhatsApp / SMS — Termii in Nigeria, Africa's Talking elsewhere, Twilio as fallback
- AI provider is an interface — Claude today, room for region-specific models if cost or latency demands it later

### Likely expansion order
1. **Ghana (2027)** — similar tax structure, Mono coverage exists, large freelancer base, English-speaking
2. **Kenya (2027/2028)** — KRA's iTax system is well-documented, big creator economy, M-Pesa integration becomes a feature
3. **South Africa (2028)** — SARS is more complex; this is when you hire a SA tax lead

---

## 16. The Most Important Product Insight

The product should feel like:

> **"PayWise understands my business finances. I don't have to think about tax anymore."**

Not:

> **"Another piece of software I have to maintain."**

That distinction — utility app vs. trusted relationship — is the difference between a feature anyone can copy and a brand Nigerians will defend on Twitter at 2am.

---

## Appendix A — Key Nigerian Tax Facts To Encode

- **Authority:** Nigeria Revenue Service (NRS), formerly FIRS
- **Law:** Nigeria Tax Act 2025, effective 1 January 2026
- **PIT tax-free threshold:** ₦800,000 / year
- **PIT progressive brackets:** 15% / 18% / 21% / 23% / 25%
- **Small company exemption:** turnover ≤ ₦100m AND fixed assets ≤ ₦250m → no CIT, CGT, or Development Levy
- **VAT rate:** 7.5%, registration threshold tied to ₦100m turnover
- **Rent relief:** 20% of annual rent, capped at ₦500,000
- **Tax residency:** 183 days in Nigeria in a 12-month period → worldwide income taxable
- **Individual filing deadline:** 31 March of the following year
- **WHT on professional services:** typically 5–10%, claimable as a credit
- **TIN:** usually auto-issued via BVN/NIN for individuals — most users already have one and don't know it

---

## Appendix B — Claude Model Quick Reference (as of mid-2026)

| Model | Use it for | Don't use it for |
| --- | --- | --- |
| **Haiku 4.5** ($1/$5 per MTok) | Categorization, OCR extraction, anomaly summaries, daily digests, batch jobs | Multi-step reasoning, nuanced conversation, ambiguous edge cases |
| **Sonnet 4.6** ($3/$15 per MTok) | Conversational assistant, tax explanations, invoice copy, anything user-facing and quality-sensitive | High-volume classification (overkill), trivial extraction (waste) |
| **Opus 4.7** ($5/$25 per MTok) | Genuinely hard reasoning fallback when Sonnet confidence is low; founder/engineer planning conversations | Production hot paths — too expensive at scale, 35% tokenizer overhead |

**Always-on cost levers:**
- Prompt caching (cached input at 10% of base rate)
- Batch API (50% off everything, results in ≤24h)
- Local merchant dictionary (skip the LLM entirely)
- Tool-use / structured outputs (no wasted output tokens, no retry loops)

**Always-on instrumentation:**
- `ai_cost_ledger` table records every call
- PostHog dashboard tracks $/user/month, cache hit rate, batch utilization, dictionary hit rate
- Pager alert on $/user/day anomalies

---

*End of plan.*
