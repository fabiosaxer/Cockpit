import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

const ERRORS: Record<string, string> = {
  forbidden: "Dieses Konto hat keine Freigabe für das Cockpit.",
  auth: "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="instrument w-full max-w-sm p-6 pt-8">
        <div className="flex flex-col items-center gap-3">
          <Logo size={64} />
          <div className="text-2xl font-black">Cockpit</div>
          <div className="label">Anmelden</div>
        </div>
        {error && ERRORS[error] && (
          <p className="mt-5 rounded-md border border-red/60 bg-red/10 p-2 text-center font-mono text-xs text-red">
            {ERRORS[error]}
          </p>
        )}
        <LoginForm microsoft={process.env.NEXT_PUBLIC_AUTH_MICROSOFT === "true"} />
      </div>
    </main>
  );
}
