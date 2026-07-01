import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { monoProvider } from "@/services/banking/mono";
import { syncAccountTransactions } from "@/services/banking/ingest";

export const maxDuration = 60;

type MonoWebhookBody = {
  event?: string;
  data?: {
    id?: string;
    _id?: string;
    account?: { id?: string; _id?: string };
  };
};

function extractAccountId(body: MonoWebhookBody): string | null {
  return (
    body.data?.account?._id ??
    body.data?.account?.id ??
    body.data?._id ??
    body.data?.id ??
    null
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Reject anything we can't authenticate — never ingest unverified data.
  if (!monoProvider.verifyWebhook(request.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: MonoWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const providerAccountId = extractAccountId(body);
  if (!providerAccountId) {
    // Acknowledge unrelated events so Mono stops retrying them.
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const admin = createAdminClient();

    // The exchange step already linked this account to a user; use that to
    // scope the sync (the webhook itself carries no user identity).
    const { data: account } = await admin
      .from("bank_accounts")
      .select("user_id")
      .eq("provider", "mono")
      .eq("provider_account_id", providerAccountId)
      .maybeSingle();

    if (!account?.user_id) {
      return NextResponse.json({ ok: true, unlinked: true });
    }

    const { inserted } = await syncAccountTransactions(
      admin,
      monoProvider,
      account.user_id as string,
      providerAccountId
    );
    return NextResponse.json({ ok: true, inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
