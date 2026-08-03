"use client";

import { useActionState } from "react";
import { updateKunde, type KundeFormState } from "@/lib/actions";

const initialState: KundeFormState = { error: null };

export default function KundeBearbeitenForm({
  kunde,
}: {
  kunde: {
    id: string;
    vorname: string;
    nachname: string;
    handynummer: string | null;
    email: string | null;
    typ: string;
  };
}) {
  const action = updateKunde.bind(null, kunde.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1">
        <label htmlFor="vorname" className="text-sm font-semibold">
          Vorname *
        </label>
        <input
          id="vorname"
          name="vorname"
          required
          defaultValue={kunde.vorname}
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nachname" className="text-sm font-semibold">
          Nachname *
        </label>
        <input
          id="nachname"
          name="nachname"
          required
          defaultValue={kunde.nachname}
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="typ" className="text-sm font-semibold">
          Typ *
        </label>
        <select
          id="typ"
          name="typ"
          required
          defaultValue={kunde.typ}
          className="input"
        >
          <option value="NEUKUNDE">Neukunde</option>
          <option value="STAMMKUNDE">Stammkunde</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="handynummer" className="text-sm font-semibold">
          Handynummer
        </label>
        <input
          id="handynummer"
          name="handynummer"
          defaultValue={kunde.handynummer ?? ""}
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={kunde.email ?? ""}
          className="input"
        />
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        Mindestens Handynummer oder E-Mail wird benötigt.
      </p>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Speichern…" : "Änderungen speichern"}
      </button>
    </form>
  );
}
