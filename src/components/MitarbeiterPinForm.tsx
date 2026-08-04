"use client";

import { useActionState, useState } from "react";
import { adminSetzePin, type AdminPinFormState } from "@/lib/admin-actions";

const initialState: AdminPinFormState = { error: null, erfolg: null };

export default function MitarbeiterPinForm({
  mitarbeiterId,
  name,
  hatPin,
}: {
  mitarbeiterId: string;
  name: string;
  hatPin: boolean;
}) {
  const action = adminSetzePin.bind(null, mitarbeiterId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [pin, setPin] = useState("");

  return (
    <li className="flex flex-col gap-1.5 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold flex-1">{name}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            hatPin
              ? "text-green-700 bg-green-100"
              : "text-amber-700 bg-amber-100"
          }`}
        >
          {hatPin ? "PIN gesetzt" : "keine PIN"}
        </span>
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <input
          name="pin"
          type="text"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="4-stellige PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="input text-sm py-1"
        />
        <button
          type="submit"
          disabled={pending || pin.length !== 4}
          className="btn-secondary py-1 text-sm shrink-0"
        >
          {pending ? "…" : hatPin ? "Zurücksetzen" : "PIN setzen"}
        </button>
      </form>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.erfolg && <p className="text-xs text-green-700">{state.erfolg}</p>}
    </li>
  );
}
