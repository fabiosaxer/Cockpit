import Link from "next/link";
import { Clock, CrewRest, Greeting } from "@/components/Clock";
import { LiveLogo } from "@/components/LiveLogo";
import { Sky } from "@/components/Sky";
import { Nav } from "@/components/Nav";
import { formatLong, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-clip">
      <Sky birthday={process.env.BIRTHDAY} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-32 sm:pb-12">
        <header className="mb-10 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <LiveLogo size={40} />
            <div className="drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">
              <div className="text-xl leading-tight font-black">
                <Greeting />, Fabio
              </div>
              <div className="text-sm font-semibold opacity-90">{formatLong(todayISO())}</div>
              <CrewRest />
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
