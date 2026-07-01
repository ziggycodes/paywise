# PayWise

AI financial copilot for Nigerian freelancers — Phase 1 foundation.

## Identity model

- **Auth session:** Supabase `auth.users.id` (UUID) is the login primary key.
- **Planned canonical dedup:** `users.nin_hash` — one-way hash of NIN only; raw NIN is never stored. When NIN verification ships, `check-identity` will treat `nin_hash` as the primary collision key.
- **Interim dedup:** unique `phone`, `bvn_hash`, and `whatsapp_phone` via the `check-identity` edge function until NIN collection is live.

## What’s in Phase 1

- Next.js 15 + TypeScript + Tailwind + shadcn-style UI
- Supabase schema (migrations), RLS, identity columns, merchant seed
- Auth: email and Google OAuth (phone verified during onboarding)
- Onboarding wizard with PostHog events
- Dashboard hero widget shells + Realtime transactions stub
- `services/ai/*` with `ai_cost_ledger` logging
- Edge function `check-identity` (phone / BVN / WhatsApp dedup)
- Privacy & terms placeholders

## Setup (your steps)

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Install CLI: `npm install -g supabase`
3. Link: `supabase link --project-ref YOUR_REF`
4. Apply migrations: `supabase db push`
5. Deploy edge function: `supabase functions deploy check-identity`

**Auth providers (Dashboard → Authentication → Providers):**

- Email: enabled; **Confirm email** enabled (hosted projects)
- Google: enable + add OAuth client (Google Cloud Console)
- Phone: enable for hosted OTP; configure Twilio (or MessageBird) for real SMS

**Redirect URLs:** add `http://localhost:3000/auth/callback` and your Vercel URL.

### Verification (local dev vs cloud)

Point `.env.local` at either **local Supabase** (`http://127.0.0.1:54321`) or your **hosted** project URL.

| Flow | Local (`supabase start`) | Cloud (supabase.com) |
|------|--------------------------|----------------------|
| Email confirm (OTP) | `enable_confirmations` in [`supabase/config.toml`](supabase/config.toml); emails in **Inbucket** at http://localhost:54324 (use the 6-digit OTP code) | Dashboard → Email Templates → Confirmation: include `{{ .Token }}`; confirm email **ON**; optional custom SMTP |
| Phone OTP | Test numbers in `config.toml` → OTP `123456` (e.g. `08031234567`, `08012345678`) | Dashboard → Phone + SMS provider; real SMS to your number |

After editing `config.toml`, reload Auth:

```bash
supabase stop --no-backup
supabase start
```

**Local email:** sign up → open Inbucket → copy the 6-digit OTP code → enter it in the app → onboarding.

**Local phone:** onboarding phone step → enter a test number → Continue → enter `123456` → complete step.

**Cloud email:** if no mail arrives, check Auth logs, confirm-email setting, and redirect allow-list.

**Cloud phone:** without an SMS provider configured, OTP send will fail with an error in the UI.

### 2. Environment variables

Copy `.env.example` → `.env.local` and fill:

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server only, never expose) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project settings |
| `ANTHROPIC_API_KEY` | Anthropic console (or Vault in prod) — powers receipt OCR and PDF statement parsing |
| `BVN_HASH_PEPPER` | Generate 32+ random chars |
| `NEXT_PUBLIC_MONO_PUBLIC_KEY` | Mono dashboard → API keys (public) — enables the Connect widget |
| `MONO_SECRET_KEY` | Mono dashboard → API keys (secret, server only) |
| `MONO_WEBHOOK_SECRET` | Mono dashboard → Webhooks — set the endpoint to `/api/webhooks/mono` |

Production: store `ANTHROPIC_API_KEY` in **Supabase Vault**, not in the repo.

### 3. Auth hook (optional but recommended)

In Supabase Dashboard → Database → Webhooks, or use a Database Webhook on `auth.users` INSERT to call `check-identity` before profile creation conflicts. The app also calls it on phone bind.

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Vercel deploy

1. Import repo on Vercel
2. Add the same env vars
3. Set `NEXT_PUBLIC_APP_URL` to your production URL

### 6. Compliance (manual)

- Start NDPC registration (§9) — no code change
- Replace `/privacy` and `/terms` with lawyer-reviewed copy before launch

## Verify Phase 1 exit criteria

- [ ] Sign up with email or Google → profile step collects name
- [ ] Google sign-in → onboarding profile then phone verification step
- [ ] Complete onboarding → land on `/dashboard` with 5 hero shells
- [ ] Migrations applied; `merchant_dictionary` has seed rows
- [ ] `GET /api/ai/health` (logged in) logs to `ai_cost_ledger` when `ANTHROPIC_API_KEY` is set

## Folder structure

See `PayWise_MVP_Plan.md` §12 — `services/`, `supabase/migrations/`, `components/`, `app/`.
