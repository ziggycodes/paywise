import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/services/ai/claude";
import { extractTransactionsFromPdf } from "@/services/ai/extraction";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "PDF parsing is unavailable — AI is not configured." },
      { status: 503 }
    );
  }

  let body: { base64?: string; defaultCurrency?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const base64 = body.base64?.replace(/^data:.*;base64,/, "");
  if (!base64) {
    return NextResponse.json({ error: "Missing PDF data." }, { status: 400 });
  }

  try {
    const transactions = await extractTransactionsFromPdf(
      base64,
      user.id,
      body.defaultCurrency ?? "NGN"
    );
    return NextResponse.json({ transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not parse PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
