"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MONO_SCRIPT_SRC = "https://connect.withmono.com/connect.js";

type MonoConnectInstance = {
  setup: () => void;
  open: () => void;
};

type MonoConnectCtor = new (config: {
  key: string;
  onSuccess: (payload: { code: string }) => void;
  onClose?: () => void;
}) => MonoConnectInstance;

declare global {
  interface Window {
    Connect?: MonoConnectCtor;
  }
}

function loadMonoScript(): Promise<MonoConnectCtor> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Bank connect is only available in the browser."));
      return;
    }
    if (window.Connect) {
      resolve(window.Connect);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${MONO_SCRIPT_SRC}"]`
    );
    const onReady = () => {
      if (window.Connect) resolve(window.Connect);
      else reject(new Error("Mono widget failed to load."));
    };
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = MONO_SCRIPT_SRC;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Could not load the Mono widget."));
    document.body.appendChild(script);
  });
}

export function ConnectBank() {
  const router = useRouter();
  const publicKey = process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY;
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function exchangeCode(code: string) {
    setStatus("Syncing your transactions…");
    try {
      const res = await fetch("/api/banking/mono/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not connect your bank.");
      setStatus(`Connected. Imported ${json.inserted} transactions.`);
      router.push(`/transactions?imported=${json.inserted}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
      setStatus(null);
      setBusy(false);
    }
  }

  async function handleConnect() {
    if (!publicKey) return;
    setError(null);
    setBusy(true);
    setStatus("Opening secure bank connect…");
    try {
      const Connect = await loadMonoScript();
      const instance = new Connect({
        key: publicKey,
        onSuccess: ({ code }) => void exchangeCode(code),
        onClose: () => {
          setBusy(false);
          setStatus(null);
        },
      });
      instance.setup();
      instance.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open bank connect.");
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Connect your bank</CardTitle>
        <CardDescription>
          Securely link a Nigerian bank account through Mono. PayWise imports
          your transactions automatically and keeps them in sync.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md bg-pw-error-bg p-3 text-sm text-pw-error-text">
            {error}
          </p>
        )}
        {status && !error && (
          <p className="rounded-md bg-pw-success-bg p-3 text-sm text-pw-success-text">
            {status}
          </p>
        )}

        {!publicKey ? (
          <p className="text-sm text-pw-text-secondary">
            Bank connect is not configured yet. Add{" "}
            <code className="rounded bg-pw-bg-subtle px-1">
              NEXT_PUBLIC_MONO_PUBLIC_KEY
            </code>{" "}
            (and the server keys) to enable it, or add transactions manually and
            by statement import in the meantime.
          </p>
        ) : (
          <Button type="button" onClick={handleConnect} disabled={busy}>
            {busy ? "Working…" : "Connect with Mono"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
