"use client";

import { useActionState, useState } from "react";
import {
  updateVorgangStatus,
  verlaengereOption,
  loeseOptionAuf,
  type StatusFormState,
  type OptionVerlaengertFormState,
  type OptionAufloesenFormState,
} from "@/lib/actions";
import AnerkennungToast from "@/components/AnerkennungToast";

const statusInitialState: StatusFormState = {
  error: null,
  ermutigung: null,
  anerkennung: null,
};
const verlaengertInitialState: OptionVerlaengertFormState = {
  error: null,
  anerkennung: null,
};
const aufloesenInitialState: OptionAufloesenFormState = {
  error: null,
  anerkennung: null,
};

export default function OptionAufloesenPanel({
  vorgangId,
  optionsArt,
  optionsfrist,
}: {
  vorgangId: string;
  optionsArt: string;
  optionsfrist: string;
}) {
  const gebuchtAction = updateVorgangStatus.bind(null, vorgangId);
  const [gebuchtState, gebuchtFormAction, gebuchtPending] = useActionState(
    gebuchtAction,
    statusInitialState
  );

  const verlaengertAction = verlaengereOption.bind(null, vorgangId);
  const [verlaengertState, verlaengertFormAction, verlaengertPending] =
    useActionState(verlaengertAction, verlaengertInitialState);

  const aufloesenAction = loeseOptionAuf.bind(null, vorgangId);
  const [aufloesenState, aufloesenFormAction, aufloesenPending] =
    useActionState(aufloesenAction, aufloesenInitialState);
  const [kundeHatAbgesagt, setKundeHatAbgesagt] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[var(--color-muted)]">
        {optionsArt === "INTERN"
          ? "Intern entscheiden – buchen, verlängern oder auflösen."
          : "Kunde kontaktieren – Entscheidung einholen."}
      </p>

      <form action={gebuchtFormAction} className="flex flex-col gap-2">
        <input type="hidden" name="status" value="GEBUCHT" />
        <span className="text-sm font-semibold">Gebucht</span>
        <div className="flex items-end gap-2">
          <select name="buchungsweg" defaultValue="" className="input">
            <option value="" disabled>
              Buchungsweg wählen
            </option>
            <option value="PERSOENLICH">Persönlich</option>
            <option value="SCHRIFTLICH">Schriftlich</option>
          </select>
          <button
            type="submit"
            disabled={gebuchtPending}
            className="btn-primary"
          >
            {gebuchtPending ? "…" : "Gebucht"}
          </button>
        </div>
        {gebuchtState.error && (
          <p className="text-sm text-red-600">{gebuchtState.error}</p>
        )}
        {gebuchtState.anerkennung && (
          <AnerkennungToast text={gebuchtState.anerkennung} />
        )}
      </form>

      <form action={verlaengertFormAction} className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Verlängert</span>
        <div className="flex items-end gap-2">
          <input
            name="optionsfrist"
            type="datetime-local"
            defaultValue={optionsfrist}
            className="input"
          />
          <button
            type="submit"
            disabled={verlaengertPending}
            className="btn-secondary"
          >
            {verlaengertPending ? "…" : "Verlängert"}
          </button>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          Die bisherige Frist bleibt als Notiz im Verlauf sichtbar.
        </p>
        {verlaengertState.error && (
          <p className="text-sm text-red-600">{verlaengertState.error}</p>
        )}
        {verlaengertState.anerkennung && (
          <AnerkennungToast text={verlaengertState.anerkennung} />
        )}
      </form>

      <form action={aufloesenFormAction} className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Aufgelöst</span>
        {optionsArt === "INTERN" ? (
          <p className="text-xs text-[var(--color-muted)]">
            Kunde weiß nichts von dieser Reservierung – der Vorgang geht
            zurück in den Status vor der Option.
          </p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="kundeHatAbgesagt"
                checked={kundeHatAbgesagt}
                onChange={(e) => setKundeHatAbgesagt(e.target.checked)}
              />
              Kunde hat abgesagt
            </label>
            {kundeHatAbgesagt && (
              <input
                name="verlustgrund"
                placeholder="Kurzer Grund"
                className="input"
              />
            )}
            {!kundeHatAbgesagt && (
              <p className="text-xs text-[var(--color-muted)]">
                Ohne Absage geht der Vorgang zurück auf &bdquo;Nachfassen&ldquo;.
              </p>
            )}
          </>
        )}
        <button
          type="submit"
          disabled={aufloesenPending}
          className="btn-secondary self-start"
        >
          {aufloesenPending ? "…" : "Aufgelöst"}
        </button>
        {aufloesenState.error && (
          <p className="text-sm text-red-600">{aufloesenState.error}</p>
        )}
        {aufloesenState.anerkennung && (
          <AnerkennungToast text={aufloesenState.anerkennung} />
        )}
      </form>
    </div>
  );
}
