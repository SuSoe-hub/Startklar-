"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  updateNotiz,
  deleteNotiz,
  type UpdateNotizFormState,
  type DeleteNotizFormState,
} from "@/lib/actions";
import { BERLIN_TZ } from "@/lib/zeit";
import EmojiLeiste from "./EmojiLeiste";

type Props = {
  notiz: {
    id: string;
    text: string;
    erstelltAm: Date;
    bearbeitetAm: Date | null;
    mitarbeiter: { name: string } | null;
  };
  vorgangId: string;
  istEigene: boolean;
};

export default function NotizItem({ notiz, vorgangId, istEigene }: Props) {
  const [modus, setModus] = useState<"anzeige" | "bearbeiten" | "loeschen">(
    "anzeige"
  );

  const updateAction = updateNotiz.bind(null, notiz.id, vorgangId);
  const updateInitialState: UpdateNotizFormState = {
    error: null,
    text: notiz.text,
  };
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    updateInitialState
  );
  const textRef = useRef<HTMLTextAreaElement>(null);
  const wasPending = useRef(false);

  // Gleiches Muster wie bei KundeForm/VorgangStatusForm: React/Next setzen
  // das native <form> nach jeder Server Action zurück, deshalb den vom
  // Server zurückgegebenen Text hart auf das Textfeld erzwingen.
  useLayoutEffect(() => {
    if (textRef.current) textRef.current.value = updateState.text;
  }, [updateState]);

  useEffect(() => {
    if (wasPending.current && !updatePending && !updateState.error) {
      setModus("anzeige");
    }
    wasPending.current = updatePending;
  }, [updatePending, updateState.error]);

  function smileyEinfuegen(emoji: string) {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + emoji + el.value.slice(end);
    const cursor = start + emoji.length;
    el.selectionStart = el.selectionEnd = cursor;
    el.focus();
  }

  const deleteAction = deleteNotiz.bind(null, notiz.id, vorgangId);
  const deleteInitialState: DeleteNotizFormState = { error: null };
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    deleteInitialState
  );

  if (modus === "bearbeiten") {
    return (
      <li className="text-sm border-l-2 pl-2 border-[var(--color-border)]">
        <form action={updateFormAction} className="flex flex-col gap-2">
          <textarea
            ref={textRef}
            name="text"
            rows={2}
            defaultValue={notiz.text}
            className="input"
          />
          <EmojiLeiste onSelect={smileyEinfuegen} />
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
            <button
              type="button"
              onClick={() => setModus("anzeige")}
              className="link"
            >
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
          <button
            type="button"
            onClick={() => setModus("anzeige")}
            className="link"
          >
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
      <div className="text-xs text-[var(--color-muted)] flex items-center gap-2 flex-wrap">
        <span>
          {notiz.mitarbeiter ? `${notiz.mitarbeiter.name} · ` : ""}
          {notiz.erstelltAm.toLocaleString("de-DE", { timeZone: BERLIN_TZ })}
          {notiz.bearbeitetAm &&
            ` · bearbeitet am ${notiz.bearbeitetAm.toLocaleString("de-DE", {
              timeZone: BERLIN_TZ,
            })}`}
        </span>
        {istEigene && (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModus("bearbeiten")}
              className="link"
            >
              Bearbeiten
            </button>
            <button
              type="button"
              onClick={() => setModus("loeschen")}
              className="link"
            >
              Löschen
            </button>
          </span>
        )}
      </div>
      <div>{notiz.text}</div>
    </li>
  );
}
