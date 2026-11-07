"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingText,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`} {...rest}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/** Runder Erledigt-Knopf, zeigt sofort den Fortschritt. */
export function DoneButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Erledigt: ${label}`}
      className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-panel text-green transition hover:border-green"
    >
      {pending ? (
        <span className="size-2.5 animate-pulse rounded-full bg-green" />
      ) : (
        <svg viewBox="0 0 16 16" className="size-3.5 opacity-0 transition hover:opacity-100" aria-hidden="true">
          <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </button>
  );
}
