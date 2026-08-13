"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  updateKollegenNotiz,
  deleteKollegenNotiz,
  erledigeKollegenNotiz,
  type UpdateKollegenNotizFormState,
  type DeleteKollegenNotizFormState,
  type ErledigeKollegenNotizFormState,
} from "@/lib/actions";
import { BERLIN_TZ } from "@/lib/zeit";

type Props = {
  notiz: {
    id: string;
    kundenname: string;
    argusNummer: string | null;
    text: string;
    erstelltAm: Date;
    bearbeitetAm: Date | null;
    erledigtAm: Date | null;
    von: { name: string };
    fuer: { name: string };
  };
  // "absender": eigene gesendete Notiz, bearbeitbar/löschbar.
  // "empfaenger": an einen selbst gerichtet, nur als erledigt markierbar.
  rolle: "absender" | "empfaenger";
};

function formatDatum(datum: Date) {
  return datum.toLocaleString("de-DE", {
    timeZone: BERLIN_TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KollegenNotizItem({ notiz, rolle }: Props) {
  const [modus, setModus] = useState<"anzeige" | "bearbeiten" | "loeschen">(
    "anzeige"
  );

  const updateAction = updateKollegenNotiz.bind(null, notiz.id);
  const updateInitialState: UpdateKollegenNotizFormState = {
    error: null,
    kundenname: notiz.kundenname,
    argusNummer: notiz.argusNummer ?? "",
    text: notiz.text,
  };
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    updateInitialState
  );
  const textRef = useRef<HTMLTextAreaElement>(null);
  const wasPending = useRef(false);

  useLayoutEffect(() => {
    if (textRef.current) textRef.current.value = updateState.text;
  }, [updateState]);

  useEffect(() => {
    if (wasPending.current && !updatePending && !updateState.error) {
      setModus("anzeige");
    }
    wasPending.current = updatePending;
  }, [updatePending, updateState.error]);

  const deleteAction = deleteKollegenNotiz.bind(null, notiz.id);
  const deleteInitialState: DeleteKollegenNotizFormState = { error: null };
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    deleteInitialState
  );

  const erledigenAction = erledigeKollegenNotiz.bind(null, notiz.id);
  const erledigenInitialState: ErledigeKollegenNotizFormState = { error: null };
  const [erledigenState, erledigenFormAction, erledigenPending] = useActionState(
    erledigenAction,
    erledigenInitialState
  );

  if (modus === "bearbeiten") {
    return (
      <li className="text-sm border-l-2 pl-2 border-[var(--color-border)]">
        <form action={updateFormAction} className="flex flex-col gap-2">
          <input
            name="kundenname"
            defaultValue={updateState.kundenname}
            className="input"
            placeholder="Kundenname"
          />
          <input
            name="argusNummer"
            defaultValue={updateState.argusNummer}
            className="input"
            placeholder="Argus-Nummer"
          />
          <textarea
            ref={textRef}
            name="text"
            rows={2}
            defaultValue={notiz.text}
            className="input"
          />
          {updateState.error && (
            <p className="text-red-600 text-xs" role="alert">
              {updateState.error}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs">
            <button
              type="submit"
              disabled={updatePending}
              className="btn-secondary py-0.5 text-xs"
            >
              {updatePending ? "Speichern…" : "Speichern"}
            </button>
            <button type="button" onClick={() => setModus("anzeige")} className="link">
              Abbrechen
            </button>
          </div>
        </form>
      </li>
    );
  }

  if (modus === "loeschen") {
    return (
      <li className="text-sm border-l-2 pl-2 border-[var(--color-border)] flex flex-col gap-2">
        <span>Notiz wirklich löschen?</span>
        <div className="flex items-center gap-3 text-xs">
          <form action={deleteFormAction}>
            <button
              type="submit"
              disabled={deletePending}
              className="btn-danger py-0.5 text-xs"
            >
              {deletePending ? "…" : "Ja, löschen"}
            </button>
          </form>
          <button type="button" onClick={() => setModus("anzeige")} className="link">
            Abbrechen
          </button>
        </div>
        {deleteState.error && (
          <span className="text-red-600 text-xs">{deleteState.error}</span>
        )}
      </li>
    );
  }

  return (
    <li className="text-sm border-l-2 pl-2 border-[var(--color-border)]">
      <div className="font-semibold">
        {notiz.kundenname}
        {notiz.argusNummer && ` · Argus ${notiz.argusNummer}`}
      </div>
      <div>{notiz.text}</div>
      <div className="text-xs text-[var(--color-muted)] flex items-center gap-2 flex-wrap mt-0.5">
        <span>
          {rolle === "absender" ? `an ${notiz.fuer.name}` : `von ${notiz.von.name}`} ·{" "}
          {formatDatum(notiz.erstelltAm)}
          {notiz.bearbeitetAm && ` · bearbeitet am ${formatDatum(notiz.bearbeitetAm)}`}
        </span>
        <span className={notiz.erledigtAm ? "text-green-700" : "text-amber-700"}>
          {notiz.erledigtAm ? `erledigt am ${formatDatum(notiz.erledigtAm)}` : "offen"}
        </span>
      </div>

      {rolle === "absender" && (
        <div className="flex items-center gap-2 text-xs mt-1">
          <button type="button" onClick={() => setModus("bearbeiten")} className="link">
            Bearbeiten
          </button>
          <button type="button" onClick={() => setModus("loeschen")} className="link">
            Löschen
          </button>
        </div>
      )}

      {rolle === "empfaenger" && !notiz.erledigtAm && (
        <form action={erledigenFormAction} className="mt-1">
          <button
            type="submit"
            disabled={erledigenPending}
            className="btn-secondary py-0.5 text-xs"
          >
            {erledigenPending ? "…" : "Erledigt"}
          </button>
          {erledigenState.error && (
            <span className="text-red-600 text-xs ml-2">{erledigenState.error}</span>
          )}
        </form>
      )}
    </li>
  );
}
