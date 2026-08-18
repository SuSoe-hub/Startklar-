"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SidebarNav from "./SidebarNav";

export default function MobileNav({
  mitarbeiterName,
  istAdmin = false,
}: {
  mitarbeiterName: string;
  istAdmin?: boolean;
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
          <SidebarNav istAdmin={istAdmin} />
          <div className="pt-3 border-t border-[var(--color-border)]">
            <span className="px-2 text-sm font-bold text-[var(--color-muted)]">
              {mitarbeiterName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
