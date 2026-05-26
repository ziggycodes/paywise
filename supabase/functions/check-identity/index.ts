import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type CheckPayload = {
  phone?: string;
  bvn_hash?: string;
  whatsapp_phone?: string;
  user_id?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = (await req.json()) as CheckPayload;
    const { phone, bvn_hash, whatsapp_phone, user_id } = body;

    const conflicts: string[] = [];

    if (phone) {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (data && data.id !== user_id) {
        conflicts.push("phone");
      }
    }

    if (bvn_hash) {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("bvn_hash", bvn_hash)
        .maybeSingle();
      if (data && data.id !== user_id) {
        conflicts.push("bvn");
      }
    }

    if (whatsapp_phone) {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("whatsapp_phone", whatsapp_phone)
        .maybeSingle();
      if (data && data.id !== user_id) {
        conflicts.push("whatsapp_phone");
      }
    }

    if (conflicts.length > 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          conflicts,
          message: "An account already exists for this identity",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
