"use client";

import { useTransition } from "react";
import { markiereAnwesend, entferneAnwesend } from "@/lib/actions";

export default function WerIstHeuteDa({
  aktuellerMitarbeiter,
  bereitsAnwesend,
}: {
  aktuellerMitarbeiter: { id: string; name: string };
  bereitsAnwesend: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function markieren() {
    startTransition(() => {
      markiereAnwesend(aktuellerMitarbeiter.id);
    });
  }

  function zuruecksetzen() {
    startTransition(() => {
      entferneAnwesend(aktuellerMitarbeiter.id);
    });
  }

  if (bereitsAnwesend) {
    return (
      <div className="card border-l-4 border-l-green-400 bg-green-50/60 p-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-green-700">
          ✓ {aktuellerMitarbeiter.name} ist heute da.
        </p>
        <button
          type="button"
          onClick={zuruecksetzen}
          disabled={pending}
          className="text-xs link shrink-0"
        >
          Doch nicht? Rückgängig machen
        </button>
      </div>
    );
  }

  return (
    <div className="card border-l-4 border-l-[var(--color-primary-400)] bg-[var(--color-primary-50)]/60 p-4 flex items-center justify-between gap-3">
      <p className="text-sm font-semibold">Bist du heute da?</p>
      <button
        type="button"
        onClick={markieren}
        disabled={pending}
        className="btn-primary shrink-0"
      >
        {pending ? "…" : `Ja, ${aktuellerMitarbeiter.name} ist da`}
      </button>
    </div>
  );
}
