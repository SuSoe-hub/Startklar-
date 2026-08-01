"use client";

import { useState, useActionState } from "react";
import { mergeKunden, type MergeFormState } from "@/lib/actions";

const initialState: MergeFormState = { error: null };

export default function MergeKundeButton({
  zielKundeId,
  quelleKundeId,
  quelleName,
}: {
  zielKundeId: string;
  quelleKundeId: string;
  quelleName: string;
}) {
  const [bestaetigen, setBestaetigen] = useState(false);
  const action = mergeKunden.bind(null, zielKundeId, quelleKundeId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!bestaetigen) {
    return (
      <button type="button" onClick={() => setBestaetigen(true)} className="link">
        zusammenführen
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span>
        Alle Vorgänge von {quelleName} hierher verschieben und {quelleName}{" "}
        löschen?
      </span>
      <form action={formAction} className="inline-flex items-center gap-1">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary py-0.5 text-xs"
        >
          {pending ? "…" : "Ja, zusammenführen"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setBestaetigen(false)}
        className="link"
      >
        Abbrechen
      </button>
      {state.error && <span className="text-red-600">{state.error}</span>}
    </span>
  );
}
