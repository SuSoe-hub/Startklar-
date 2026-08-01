"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Startseite" },
  { href: "/kunden", label: "Kunden" },
  { href: "/einstellungen", label: "Einstellungen" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
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
