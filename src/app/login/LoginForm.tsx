"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type State = "idle" | "busy" | "sent" | "error";

export function LoginForm({ microsoft }: { microsoft: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "link">("password");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  function fail(msg: string) {
    setState("error");
    setMessage(
      msg.includes("Invalid login credentials")
        ? "E-Mail oder Passwort falsch."
        : msg.toLowerCase().includes("rate limit")
          ? "Zu viele Versuche. Bitte später erneut oder mit Passwort anmelden."
          : msg,
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const supabase = createClient();
    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return fail(error.message);
      window.location.href = "/";
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo(), shouldCreateUser: false },
      });
      if (error) return fail(error.message);
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
        <span className="text-xs text-dim">Öffne den Link im selben Browser, in dem du ihn angefordert hast.</span>
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
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          className="field"
        />
        {mode === "password" && (
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="field"
          />
        )}
        <button type="submit" disabled={state === "busy"} className="btn btn-primary w-full disabled:opacity-60">
          {state === "busy" ? "Prüfe…" : mode === "password" ? "Anmelden" : "Login-Link senden"}
        </button>
      </form>
      {state === "error" && <p className="font-mono text-xs text-red">{message}</p>}
      <button
        type="button"
        onClick={() => {
          setMode(mode === "password" ? "link" : "password");
          setState("idle");
        }}
        className="label block w-full text-center text-cyan"
      >
        {mode === "password" ? "Stattdessen Login-Link per E-Mail" : "Mit Passwort anmelden"}
      </button>
    </div>
  );
}
