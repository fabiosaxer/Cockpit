import Link from "next/link";
import { Clock } from "@/components/Clock";
import { Logo } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { formatLong, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28 sm:pb-10">
      <header className="mb-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={34} />
          <div>
            <div className="font-mono text-base font-bold tracking-[0.3em]">COCKPIT</div>
            <div className="text-[0.7rem] text-dim">{formatLong(todayISO())}</div>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <Nav />
          </div>
          <Clock />
        </div>
      </header>
      <main>{children}</main>
      <div className="sm:hidden">
        <Nav />
      </div>
    </div>
  );
}
