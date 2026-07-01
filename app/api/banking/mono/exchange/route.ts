import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMonoConfigured, monoProvider } from "@/services/banking/mono";
import { syncAccountTransactions } from "@/services/banking/ingest";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMonoConfigured()) {
    return NextResponse.json(
      { error: "Bank connect is unavailable — Mono is not configured." },
      { status: 503 }
    );
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.code) {
    return NextResponse.json({ error: "Missing Mono code." }, { status: 400 });
  }

  try {
    const providerAccountId = await monoProvider.exchangeToken(body.code);
    const { inserted } = await syncAccountTransactions(
      supabase,
      monoProvider,
      user.id,
      providerAccountId
    );
    return NextResponse.json({ ok: true, inserted });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not connect your bank.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
