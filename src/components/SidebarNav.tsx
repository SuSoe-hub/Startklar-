"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AbmeldenButton from "./AbmeldenButton";

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

function NavLink({ href, label, aktiv }: { href: string; label: string; aktiv: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2.5 font-bold transition-colors ${
        aktiv
          ? "bg-[var(--color-primary-600)] text-white"
          : "text-[var(--foreground)]/75 hover:bg-[var(--color-primary-50)]"
      }`}
    >
      {label}
    </Link>
  );
}

// Abmelden steht bewusst direkt unter Statistik statt unten an die Seite
// gepinnt (Susannas Wunsch): bei vielen/großen Kundenvorgängen wuchs die
// Seite so weit, dass der frühere unten fixierte Button erst nach langem
// Scrollen erreichbar war - niemand hat sich dann noch abgemeldet.
export default function SidebarNav({ istAdmin = false }: { istAdmin?: boolean }) {
  const pathname = usePathname();

  const istAktiv = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => (
        <NavLink key={link.href} {...link} aktiv={istAktiv(link.href)} />
      ))}
      <AbmeldenButton />
      {istAdmin && (
        <NavLink {...ADMIN_LINK} aktiv={istAktiv(ADMIN_LINK.href)} />
      )}
    </nav>
  );
}
