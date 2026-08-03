"use client";

import { useState, useActionState } from "react";
import { deleteVorgang, type DeleteVorgangFormState } from "@/lib/actions";

const initialState: DeleteVorgangFormState = { error: null };

export default function DeleteVorgangButton({
  vorgangId,
}: {
  vorgangId: string;
}) {
  const [bestaetigen, setBestaetigen] = useState(false);
  const action = deleteVorgang.bind(null, vorgangId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!bestaetigen) {
    return (
      <button
        type="button"
        onClick={() => setBestaetigen(true)}
        className="text-xs text-[var(--color-muted)] underline hover:text-red-600"
      >
        Vorgang löschen
      </button>
    );
  }

  return (
    <div className="text-xs flex flex-col items-start gap-2">
      <span>
        Diesen Vorgang inkl. aller Notizen wirklich unwiderruflich löschen?
      </span>
      <div className="flex items-center gap-2">
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
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
