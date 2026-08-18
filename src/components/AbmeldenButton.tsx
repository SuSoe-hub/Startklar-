"use client";

import { useState, useTransition } from "react";
import { logout } from "@/lib/auth-actions";
import { zaehleMeineFaelligenVorgaenge } from "@/lib/actions";

export default function AbmeldenButton() {
  const [pending, startTransition] = useTransition();
  const [anzahl, setAnzahl] = useState<number | null>(null);

  function pruefen() {
    startTransition(async () => {
      const n = await zaehleMeineFaelligenVorgaenge();
      setAnzahl(n);
    });
  }

  if (anzahl !== null) {
    return (
      <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
        <div className="card max-w-sm w-full p-6 flex flex-col gap-4 text-center bg-white">
          {anzahl === 0 ? (
            <p className="text-sm font-semibold text-green-700">
              ✓ Alles bearbeitet – heute ist nichts mehr für dich fällig.
            </p>
          ) : (
            <p className="text-sm font-semibold text-orange-700">
              {anzahl === 1
                ? "Du hast noch 1 fälligen Vorgang offen."
                : `Du hast noch ${anzahl} fällige Vorgänge offen.`}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <form action={logout}>
              <button type="submit" className="btn-primary w-full">
                Abmelden
              </button>
            </form>
            <button
              type="button"
              onClick={() => setAnzahl(null)}
              className="btn-secondary w-full"
            >
              Zurück zur Übersicht
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={pruefen}
      disabled={pending}
      className="rounded-full px-4 py-2.5 font-bold text-left transition-colors bg-[#f4ead0] text-[#6b4a35] hover:bg-[#ecdfba] disabled:opacity-60"
    >
      {pending ? "…" : "Abmelden"}
    </button>
  );
}
