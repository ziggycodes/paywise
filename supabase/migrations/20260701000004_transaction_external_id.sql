-- Phase 2 ingestion: idempotency key for imported/synced transactions.
-- external_id is the provider/source's own id (Mono transaction id, CSV row
-- hash, etc.). The partial unique index makes re-running an import or replaying
-- a webhook a no-op instead of creating duplicates. Manual rows leave it null.

alter table public.transactions
  add column if not exists external_id text;

create unique index if not exists transactions_user_source_external_id_key
  on public.transactions (user_id, source, external_id)
  where external_id is not null;
