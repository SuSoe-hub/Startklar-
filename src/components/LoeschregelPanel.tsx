"use client";

import { useActionState, useEffect, useState } from "react";
import {
  zaehleZurLoeschungFaelligeKunden,
  loescheAbgelaufeneKundenJetzt,
  type LoeschregelFormState,
} from "@/lib/actions";

const initialState: LoeschregelFormState = { error: null, anzahl: null };

export default function LoeschregelPanel() {
  const [anzahl, setAnzahl] = useState<number | null>(null);
  const [bestaetigen, setBestaetigen] = useState(false);
  const [state, formAction, pending] = useActionState(
    loescheAbgelaufeneKundenJetzt,
    initialState
  );

  useEffect(() => {
    zaehleZurLoeschungFaelligeKunden().then(setAnzahl);
  }, []);

  // Nach erfolgreicher Löschung neu zählen (sollte danach 0 sein).
  useEffect(() => {
    if (state.anzahl !== null) {
      zaehleZurLoeschungFaelligeKunden().then(setAnzahl);
      setBestaetigen(false);
    }
  }, [state.anzahl]);

  return (
    <div className="card p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Alte Kunden löschen (nur Admin)</h2>
      <p className="text-xs text-[var(--color-muted)]">
        Abgeschlossene Kunden (Gebucht/Verloren/Erledigt, keine offenen
        Vorgänge mehr) werden 3 Jahre ab der letzten Aktivität aufbewahrt.
        Danach dürfen sie hier endgültig gelöscht werden – die Buchung selbst
        bleibt ja dauerhaft in Argus.
      </p>

      {anzahl === null ? (
        <p className="text-sm text-[var(--color-muted)]">Prüfe…</p>
      ) : anzahl === 0 ? (
        <p className="text-sm text-green-700">
          ✓ Aktuell ist kein Kunde zur Löschung fällig.
        </p>
      ) : !bestaetigen ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-orange-700">
            {anzahl === 1
              ? "1 Kunde ist seit über 3 Jahren abgeschlossen."
              : `${anzahl} Kunden sind seit über 3 Jahren abgeschlossen.`}
          </p>
          <button
            type="button"
            onClick={() => setBestaetigen(true)}
            className="btn-secondary py-1 text-sm ml-auto shrink-0"
          >
            Jetzt aufräumen
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-orange-700">
            {anzahl === 1
              ? "1 Kunde wird unwiderruflich gelöscht (inkl. aller Vorgänge und Notizen)."
              : `${anzahl} Kunden werden unwiderruflich gelöscht (inkl. aller Vorgänge und Notizen).`}
          </p>
          <div className="flex items-center gap-2">
            <form action={formAction}>
              <button type="submit" disabled={pending} className="btn-danger py-1 text-sm">
                {pending ? "…" : "Ja, endgültig löschen"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setBestaetigen(false)}
              className="link text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {state.anzahl !== null && !state.error && (
        <p className="text-sm text-green-700">
          ✓ {state.anzahl === 1 ? "1 Kunde wurde" : `${state.anzahl} Kunden wurden`} gelöscht.
        </p>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
