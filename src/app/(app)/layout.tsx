import Link from "next/link";
import { Clock, Greeting } from "@/components/Clock";
import { Logo } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { formatLong, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-clip">
      {/* Flugzeug mit Kondensstreifen am Himmel */}
      <div aria-hidden="true" className="pointer-events-none absolute top-[4.6rem] left-0 z-0 w-full">
        <div className="plane flex w-max items-center">
          <span className="h-[2px] w-40 rounded-full bg-gradient-to-r from-transparent to-white/80" />
          <svg viewBox="0 0 48 24" className="-ml-1 h-5 w-10 text-white drop-shadow" fill="currentColor">
            <path d="M46 12c0-1.6-1.6-2.6-3.6-2.6H30L19.5 0h-4l5.8 9.4H9.5L5.2 4.2H2l2.6 7.8L2 19.8h3.2l4.3-5.2h11.8L15.5 24h4L30 14.6h12.4c2 0 3.6-1 3.6-2.6z" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-32 sm:pb-12">
        <header className="mb-10 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <span className="rounded-full shadow-[0_6px_16px_-6px_rgba(10,60,110,0.6)]">
              <Logo size={40} />
            </span>
            <div className="drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">
              <div className="text-xl leading-tight font-black">
                <Greeting />, Fabio
              </div>
              <div className="text-sm font-semibold opacity-90">{formatLong(todayISO())}</div>
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
      </div>
      <div className="sm:hidden">
        <Nav />
      </div>
    </div>
  );
}
