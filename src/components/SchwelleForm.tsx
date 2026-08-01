"use client";

import { useActionState } from "react";
import { updateSchwelle, type EinstellungenFormState } from "@/lib/actions";

const initialState: EinstellungenFormState = { error: null };

export default function SchwelleForm({ aktuellerWert }: { aktuellerWert: number }) {
  const [state, formAction, pending] = useActionState(
    updateSchwelle,
    initialState
  );

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="schwelle" className="text-sm font-semibold">
          Schwelle für Hinweis bei wiederholten Anfragen
        </label>
        <input
          id="schwelle"
          name="schwelle"
          type="number"
          min={1}
          defaultValue={aktuellerWert}
          className="input w-24"
        />
      </div>
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "…" : "Speichern"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
