"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={
        className ??
        "block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text disabled:opacity-50"
      }
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
