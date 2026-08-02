"use client";

import { useActionState } from "react";
import { uebernehmeVorgang, type UebernahmeFormState } from "@/lib/actions";
import AnerkennungToast from "@/components/AnerkennungToast";

const initialState: UebernahmeFormState = { error: null, anerkennung: null };

export default function UebernahmeForm({
  vorgangId,
  anwesende,
}: {
  vorgangId: string;
  anwesende: { id: string; name: string }[];
}) {
  const action = uebernehmeVorgang.bind(null, vorgangId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2 mt-2">
      <select
        name="neuerBeraterId"
        defaultValue=""
        className="input py-1 text-sm"
      >
        <option value="" disabled>
          Wer übernimmt?
        </option>
        {anwesende.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="btn-secondary py-1 text-sm"
      >
        {pending ? "…" : "Ich übernehme"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.anerkennung && <AnerkennungToast text={state.anerkennung} />}
    </form>
  );
}
