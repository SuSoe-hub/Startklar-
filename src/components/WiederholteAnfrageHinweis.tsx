"use client";

import { useState } from "react";

export default function WiederholteAnfrageHinweis({
  anzahlBisher,
  seitMonatJahr,
  letzterBerater,
  letztesDatum,
}: {
  anzahlBisher: number;
  seitMonatJahr: string;
  letzterBerater: string;
  letztesDatum: string;
}) {
  const [offen, setOffen] = useState(false);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-label="Hinweis zu bisherigen Anfragen anzeigen"
        className="w-6 h-6 rounded-full border border-[var(--color-border)] text-[var(--color-muted)] text-xs flex items-center justify-center hover:bg-[var(--color-primary-50)]"
      >
        i
      </button>
      {offen && (
        <p className="mt-1 text-sm text-[var(--color-muted)] border-l-2 border-[var(--color-border)] pl-2">
          {anzahlBisher + 1}. Anfrage seit {seitMonatJahr}, bisher keine
          Buchung. Zuletzt beraten von {letzterBerater} am {letztesDatum}
        </p>
      )}
    </div>
  );
}
