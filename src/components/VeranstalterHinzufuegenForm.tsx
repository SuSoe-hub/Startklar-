"use client";

import { useActionState } from "react";
import { addVeranstalter, type VeranstalterFormState } from "@/lib/actions";

const initialState: VeranstalterFormState = { error: null };

export default function VeranstalterHinzufuegenForm() {
  const [state, formAction, pending] = useActionState(
    addVeranstalter,
    initialState
  );

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="code" className="text-sm font-semibold">
          Neuer Veranstalter (Kürzel)
        </label>
        <input id="code" name="code" className="input w-32" />
      </div>
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "…" : "Hinzufügen"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
