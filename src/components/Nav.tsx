"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Cockpit", icon: "M3 13a9 9 0 0 1 18 0M12 13l4-4M7 13h0M17 13h0" },
  { href: "/projekte", label: "Projekte", icon: "M4 6h16M4 12h10M4 18h13" },
  { href: "/abwesenheiten", label: "Abwesend", icon: "M8 7V4h8v3M3 7h18v12H3zM3 12h18" },
  { href: "/einstellungen", label: "Einstellungen", icon: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(11,138,214,0.35)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:pb-0 sm:shadow-none">
      <ul className="mx-auto flex max-w-md justify-around sm:max-w-none sm:justify-end sm:gap-1">
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" || path.startsWith("/bereich") : path.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex flex-col items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold sm:flex-row ${
                  active ? "text-cyan sm:bg-white sm:shadow" : "text-dim sm:text-white/90"
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d={l.icon} />
                </svg>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
