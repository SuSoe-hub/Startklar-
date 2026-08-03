"use client";

import { useState, useActionState } from "react";
import { deleteKunde, type DeleteKundeFormState } from "@/lib/actions";

const initialState: DeleteKundeFormState = { error: null };

export default function DeleteKundeButton({
  kundeId,
  anzahlVorgaenge,
}: {
  kundeId: string;
  anzahlVorgaenge: number;
}) {
  const [bestaetigen, setBestaetigen] = useState(false);
  const [mitVorgaengen, setMitVorgaengen] = useState(false);
  const action = deleteKunde.bind(null, kundeId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!bestaetigen) {
    return (
      <button
        type="button"
        onClick={() => setBestaetigen(true)}
        className="text-xs text-[var(--color-muted)] underline hover:text-red-600"
      >
        Kunde löschen
      </button>
    );
  }

  const hatVorgaenge = anzahlVorgaenge > 0;

  return (
    <div className="text-xs flex flex-col items-start gap-2">
      {hatVorgaenge ? (
        <>
          <span>
            Dieser Kunde hat {anzahlVorgaenge}{" "}
            {anzahlVorgaenge === 1 ? "Vorgang" : "Vorgänge"}. Diese werden
            beim Löschen ebenfalls unwiderruflich entfernt.
          </span>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={mitVorgaengen}
              onChange={(e) => setMitVorgaengen(e.target.checked)}
            />
            Ja, auch alle Vorgänge löschen
          </label>
        </>
      ) : (
        <span>Diesen Kunden wirklich unwiderruflich löschen?</span>
      )}
      <div className="flex items-center gap-2">
        <form action={formAction}>
          <input
            type="checkbox"
            name="mitVorgaengen"
            checked={mitVorgaengen}
            readOnly
            hidden
          />
          <button
            type="submit"
            disabled={pending || (hatVorgaenge && !mitVorgaengen)}
            className="btn-danger py-0.5 text-xs"
          >
            {pending ? "…" : "Ja, löschen"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setBestaetigen(false)}
          className="link"
        >
          Abbrechen
        </button>
      </div>
      {state.error && <span className="text-red-600">{state.error}</span>}
    </div>
  );
}
