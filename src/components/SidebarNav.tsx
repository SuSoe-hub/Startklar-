"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Startseite" },
  { href: "/kunden", label: "Kunden" },
  { href: "/kollegen-notizen", label: "Kollegen-Notizen" },
  { href: "/einstellungen", label: "Einstellungen" },
  { href: "/rangliste", label: "Statistik" },
];

// Nur für Admins sichtbar - zeigt personenbezogene Login-/Logout-Zeiten
// (siehe Startklar_Erweiterung_Zeiterfassung_Homeoffice.md, Punkt 4).
const ADMIN_LINK = { href: "/anwesenheit", label: "Anwesenheit" };

export default function SidebarNav({ istAdmin = false }: { istAdmin?: boolean }) {
  const pathname = usePathname();
  const links = istAdmin ? [...LINKS, ADMIN_LINK] : LINKS;

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const aktiv =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2.5 font-bold transition-colors ${
              aktiv
                ? "bg-[var(--color-primary-600)] text-white"
                : "text-[var(--foreground)]/75 hover:bg-[var(--color-primary-50)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
