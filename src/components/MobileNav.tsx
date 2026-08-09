"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import SidebarNav from "./SidebarNav";

export default function MobileNav({
  mitarbeiterName,
}: {
  mitarbeiterName: string;
}) {
  const [offen, setOffen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOffen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-label={offen ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={offen}
        className="p-2 -m-2 text-2xl leading-none"
      >
        {offen ? "✕" : "☰"}
      </button>

      {offen && (
        <div className="fixed inset-x-0 top-14 z-20 bg-white border-b border-[var(--color-border)] p-4 flex flex-col gap-3 shadow-md">
          <SidebarNav />
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-border)]">
            <span className="text-sm font-bold text-[var(--color-muted)]">
              {mitarbeiterName}
            </span>
            <form action={logout}>
              <button type="submit" className="btn-secondary">
                Abmelden
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
