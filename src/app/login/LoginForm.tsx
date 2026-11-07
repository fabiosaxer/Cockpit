"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ microsoft }: { microsoft: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  }

  async function signInMicrosoft() {
    await createClient().auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo: redirectTo(), scopes: "email" },
    });
  }

  if (state === "sent") {
    return (
      <p className="mt-6 text-center font-mono text-sm text-green glow-green">
        CLEARED · Link unterwegs.
        <br />
        <span className="text-xs text-dim">Prüfe dein Postfach und öffne den Link auf diesem Gerät.</span>
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {microsoft && (
        <>
          <button type="button" onClick={signInMicrosoft} className="btn w-full">
            Mit Microsoft anmelden
          </button>
          <div className="label text-center">oder</div>
        </>
      )}
      <form onSubmit={sendLink} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          className="field"
        />
        <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full disabled:opacity-60">
          {state === "sending" ? "Sende…" : "Login-Link senden"}
        </button>
      </form>
      {state === "error" && <p className="font-mono text-xs text-red">{message}</p>}
    </div>
  );
}
