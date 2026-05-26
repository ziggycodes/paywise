# PayWise

AI financial copilot for Nigerian freelancers — Phase 1 foundation.

## What’s in Phase 1

- Next.js 15 + TypeScript + Tailwind + shadcn-style UI
- Supabase schema (migrations), RLS, identity columns, merchant seed
- Auth: email, Google OAuth, phone OTP
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

- Email: enabled
- Google: enable + add OAuth client (Google Cloud Console)
- Phone: enable SMS (Twilio or Supabase test OTP)

**Redirect URLs:** add `http://localhost:3000/auth/callback` and your Vercel URL.

### 2. Environment variables

Copy `.env.example` → `.env.local` and fill:

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server only, never expose) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project settings |
| `ANTHROPIC_API_KEY` | Anthropic console (or Vault in prod) |
| `BVN_HASH_PEPPER` | Generate 32+ random chars |

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

- [ ] Sign up with phone OTP → duplicate number returns error
- [ ] Google sign-in → forced through onboarding phone step
- [ ] Complete onboarding → land on `/dashboard` with 5 hero shells
- [ ] Migrations applied; `merchant_dictionary` has seed rows
- [ ] `GET /api/ai/health` (logged in) logs to `ai_cost_ledger` when `ANTHROPIC_API_KEY` is set

## Folder structure

See `PayWise_MVP_Plan.md` §12 — `services/`, `supabase/migrations/`, `components/`, `app/`.
