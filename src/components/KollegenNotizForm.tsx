"use client";

import { useActionState, useRef } from "react";
import { addKollegenNotiz, type KollegenNotizFormState } from "@/lib/actions";

const initialState: KollegenNotizFormState = { error: null };

export default function KollegenNotizForm({
  mitarbeiter,
}: {
  mitarbeiter: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    addKollegenNotiz,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 max-w-md"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="fuerId" className="text-sm font-semibold">
          Für *
        </label>
        <select id="fuerId" name="fuerId" required defaultValue="" className="input">
          <option value="" disabled>
            Kolleg:in wählen
          </option>
          {mitarbeiter.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="kundenname" className="text-sm font-semibold">
          Kundenname *
        </label>
        <input id="kundenname" name="kundenname" type="text" required className="input" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="argusNummer" className="text-sm font-semibold">
          Argus-Nummer
        </label>
        <input id="argusNummer" name="argusNummer" type="text" className="input" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="text" className="text-sm font-semibold">
          Notiz *
        </label>
        <textarea id="text" name="text" rows={3} required className="input" />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Speichern…" : "Notiz senden"}
      </button>
    </form>
  );
}
