"use client";

import { useActionState, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createKunde,
  checkDuplicateKunde,
  type DuplicateHinweis,
  type KundeFormState,
} from "@/lib/actions";
import { enthaeltUmlaut } from "@/lib/umlaute";

const initialState: KundeFormState = {
  error: null,
  vorname: "",
  nachname: "",
  typ: "",
  handynummer: "",
  email: "",
};

export default function KundeForm() {
  const [state, formAction, pending] = useActionState(
    createKunde,
    initialState
  );
  const [handynummer, setHandynummer] = useState("");
  const [email, setEmail] = useState("");
  const [hinweis, setHinweis] = useState<DuplicateHinweis>(null);
  const [trotzdemAnlegen, setTrotzdemAnlegen] = useState(false);
  const [umlautImNamen, setUmlautImNamen] = useState(false);

  const vornameRef = useRef<HTMLInputElement>(null);
  const nachnameRef = useRef<HTMLInputElement>(null);
  const typRef = useRef<HTMLSelectElement>(null);

  // React/Next setzen das native <form>-Element nach jeder Server Action
  // zurück, auch bei einem Validierungsfehler (siehe VorgangStatusForm).
  // Deshalb hier die vom Server zurückgegebenen, tatsächlich eingegebenen
  // Werte hart auf das DOM erzwingen, statt sie verloren gehen zu lassen.
  useLayoutEffect(() => {
    if (vornameRef.current) vornameRef.current.value = state.vorname;
    if (nachnameRef.current) nachnameRef.current.value = state.nachname;
    if (typRef.current) typRef.current.value = state.typ;
    setHandynummer(state.handynummer);
    setEmail(state.email);
    setUmlautImNamen(
      enthaeltUmlaut(state.vorname) || enthaeltUmlaut(state.nachname)
    );
  }, [state]);

  async function pruefeDublette(handy: string, mail: string) {
    const result = await checkDuplicateKunde(handy, mail);
    setHinweis(result);
    setTrotzdemAnlegen(false);
  }

  function pruefeUmlaut() {
    setUmlautImNamen(
      enthaeltUmlaut(vornameRef.current?.value ?? "") ||
        enthaeltUmlaut(nachnameRef.current?.value ?? "")
    );
  }

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
          defaultValue={state.vorname}
          onChange={pruefeUmlaut}
          required
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
          defaultValue={state.nachname}
          onChange={pruefeUmlaut}
          required
          className="input"
        />
      </div>

      {umlautImNamen && (
        <p className="text-xs text-orange-700">
          Tipp: Für Argus lieber ausschreiben – ü → ue, ä → ae, ö → oe, ß →
          ss (sonst findet Argus den Kunden beim Einfügen nicht).
        </p>
      )}

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
          <option value="" disabled>
            Bitte wählen
          </option>
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
          value={handynummer}
          onChange={(e) => setHandynummer(e.target.value)}
          onBlur={() => pruefeDublette(handynummer, email)}
          className="input"
        />
        {hinweis?.handyTreffer && (
          <p className="text-xs font-semibold text-orange-700">
            Diese Handynummer ist bereits bei {hinweis.name} hinterlegt.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => pruefeDublette(handynummer, email)}
          className="input"
        />
        {hinweis?.emailTreffer && (
          <p className="text-xs font-semibold text-orange-700">
            Diese E-Mail-Adresse ist bereits bei {hinweis.name} hinterlegt.
          </p>
        )}
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        Mindestens Handynummer oder E-Mail wird benötigt. Ist nur eines von
        beiden ausgefüllt, wird der Kunde trotzdem gespeichert und orange
        markiert.
      </p>

      {hinweis && (
        <div className="card border-l-4 border-l-[var(--color-primary-400)] bg-[var(--color-primary-50)]/60 p-3 text-sm flex flex-col gap-2">
          <p>
            {hinweis.letzteBeratung
              ? `${hinweis.name} wurde am ${hinweis.letzteBeratung.datum} von ${hinweis.letzteBeratung.berater} beraten.`
              : `${hinweis.name} ist bereits als Kunde angelegt.`}{" "}
            <Link href={`/kunden/${hinweis.kundeId}`} className="font-semibold link">
              Vorgang öffnen?
            </Link>
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={trotzdemAnlegen}
              onChange={(e) => setTrotzdemAnlegen(e.target.checked)}
            />
            Ich möchte trotzdem einen neuen Kunden anlegen.
          </label>
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || (!!hinweis && !trotzdemAnlegen)}
        className="btn-primary self-start"
      >
        {pending ? "Speichern…" : "Kunde speichern"}
      </button>
    </form>
  );
}
