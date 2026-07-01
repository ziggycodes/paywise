import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/services/ai/claude";
import { extractReceipt } from "@/services/ai/extraction";

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
      { error: "Receipt scanning is unavailable — AI is not configured." },
      { status: 503 }
    );
  }

  let body: { base64?: string; mediaType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const base64 = body.base64?.replace(/^data:.*;base64,/, "");
  if (!base64 || !body.mediaType) {
    return NextResponse.json(
      { error: "Missing image data or type." },
      { status: 400 }
    );
  }

  try {
    const receipt = await extractReceipt(base64, body.mediaType, user.id);
    if (!receipt) {
      return NextResponse.json(
        { error: "Could not read this receipt. Try a clearer photo." },
        { status: 422 }
      );
    }
    return NextResponse.json({ receipt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not scan receipt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
