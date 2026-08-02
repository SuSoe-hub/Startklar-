"use client";

import { useActionState } from "react";
import {
  updateWiedervorlage,
  type WiedervorlageFormState,
} from "@/lib/actions";
import AnerkennungToast from "@/components/AnerkennungToast";

const initialState: WiedervorlageFormState = { error: null, anerkennung: null };

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function WiedervorlageForm({
  vorgangId,
  wiedervorlage,
}: {
  vorgangId: string;
  wiedervorlage: string | null;
}) {
  const action = updateWiedervorlage.bind(null, vorgangId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="wiedervorlage" className="text-sm font-semibold">
          Wiedervorlage
        </label>
        <input
          id="wiedervorlage"
          name="wiedervorlage"
          type="datetime-local"
          defaultValue={toLocalInputValue(wiedervorlage)}
          className="input"
        />
      </div>
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "…" : "Ändern"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.anerkennung && <AnerkennungToast text={state.anerkennung} />}
    </form>
  );
}
