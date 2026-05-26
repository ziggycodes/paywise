import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAiHealthCheck } from "@/services/ai/claude";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAiHealthCheck(user.id);
  return NextResponse.json(result);
}
