"use client";

import { useActionState, useLayoutEffect, useRef } from "react";
import { updateKunde, type KundeFormState } from "@/lib/actions";

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
  const initialState: KundeFormState = {
    error: null,
    vorname: kunde.vorname,
    nachname: kunde.nachname,
    typ: kunde.typ,
    handynummer: kunde.handynummer ?? "",
    email: kunde.email ?? "",
  };
  const [state, formAction, pending] = useActionState(action, initialState);

  const vornameRef = useRef<HTMLInputElement>(null);
  const nachnameRef = useRef<HTMLInputElement>(null);
  const typRef = useRef<HTMLSelectElement>(null);
  const handynummerRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // React/Next setzen das native <form>-Element nach jeder Server Action
  // zurück, auch bei einem Validierungsfehler (siehe VorgangStatusForm) -
  // ohne das hier würden bei einem fehlgeschlagenen Speichern alle Felder
  // auf den ursprünglichen (alten) Kundenstand zurückspringen, statt die
  // gerade eingegebenen Werte zu behalten.
  useLayoutEffect(() => {
    if (vornameRef.current) vornameRef.current.value = state.vorname;
    if (nachnameRef.current) nachnameRef.current.value = state.nachname;
    if (typRef.current) typRef.current.value = state.typ;
    if (handynummerRef.current) handynummerRef.current.value = state.handynummer;
    if (emailRef.current) emailRef.current.value = state.email;
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1">
        <label htmlFor="vorname" className="text-sm font-semibold">
          Vorname *
        </label>
        <input
          id="vorname"
          name="vorname"
          ref={vornameRef}
          required
          defaultValue={state.vorname}
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
          ref={nachnameRef}
          required
          defaultValue={state.nachname}
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
          ref={typRef}
          required
          defaultValue={state.typ}
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
          ref={handynummerRef}
          defaultValue={state.handynummer}
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
          ref={emailRef}
          defaultValue={state.email}
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
