"use client";

import { useActionState, useEffect, useState } from "react";
import { updateVorgangStatus, type StatusFormState } from "@/lib/actions";
import AnerkennungToast from "@/components/AnerkennungToast";

const initialState: StatusFormState = {
  error: null,
  ermutigung: null,
  anerkennung: null,
};

export default function VorgangStatusForm({
  vorgangId,
  status,
  veranstalter,
  vorschlagOptionsfrist,
}: {
  vorgangId: string;
  status: string;
  veranstalter: { id: string; code: string }[];
  vorschlagOptionsfrist: string;
}) {
  const action = updateVorgangStatus.bind(null, vorgangId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [ausgewaehlterStatus, setAusgewaehlterStatus] = useState(status);
  const [optionsArt, setOptionsArt] = useState("KUNDENOPTION");
  const [veranstalterId, setVeranstalterId] = useState("");

  // Hält die Auswahl mit dem Server-Wert synchron, ohne die Komponente neu zu
  // mounten (ein key={status} auf der aufrufenden Seite würde sonst auch die
  // gerade erst gesetzte Ermutigungs-Nachricht wieder löschen).
  useEffect(() => {
    setAusgewaehlterStatus(status);
  }, [status]);

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-sm font-semibold">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={ausgewaehlterStatus}
          onChange={(e) => setAusgewaehlterStatus(e.target.value)}
          className="input"
        >
          <option value="ANGEBOT_RAUS">Angebot raus</option>
          <option value="OPTION">Option</option>
          <option value="NACHFASSEN">Nachfassen</option>
          <option value="GEBUCHT">Gebucht</option>
          <option value="VERLOREN">Verloren</option>
        </select>
      </div>

      {ausgewaehlterStatus === "OPTION" && (
        <div className="flex flex-col gap-3 border-l-2 border-[var(--color-border)] pl-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="optionsArt" className="text-sm font-semibold">
              Optionsart *
            </label>
            <select
              id="optionsArt"
              name="optionsArt"
              value={optionsArt}
              onChange={(e) => setOptionsArt(e.target.value)}
              className="input"
            >
              <option value="KUNDENOPTION">Kundenoption</option>
              <option value="INTERN">Interne Option</option>
            </select>
            {optionsArt === "INTERN" && (
              <p className="text-xs text-amber-700 font-semibold">
                Kunde weiß nichts von dieser Reservierung.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="optionVorgangsnummer"
              className="text-sm font-semibold"
            >
              Vorgangsnummer beim Veranstalter *
            </label>
            <input
              id="optionVorgangsnummer"
              name="optionVorgangsnummer"
              className="input"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="optionVeranstalterId"
              className="text-sm font-semibold"
            >
              Veranstalter *
            </label>
            <select
              id="optionVeranstalterId"
              name="optionVeranstalterId"
              value={veranstalterId}
              onChange={(e) => setVeranstalterId(e.target.value)}
              className="input"
            >
              <option value="" disabled>
                Bitte wählen
              </option>
              {veranstalter.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code}
                </option>
              ))}
              <option value="SONSTIGE">Sonstige</option>
            </select>
            {veranstalterId === "SONSTIGE" && (
              <input
                name="optionVeranstalterSonstige"
                placeholder="Name des Veranstalters"
                className="input mt-1"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="optionsfrist" className="text-sm font-semibold">
              Optionsfrist *
            </label>
            <input
              id="optionsfrist"
              name="optionsfrist"
              type="datetime-local"
              defaultValue={vorschlagOptionsfrist}
              className="input"
            />
            <p className="text-xs text-[var(--color-muted)]">
              Vorschlag: heute + 3 Werktage, 18:00 Uhr. Maßgeblich ist die
              Frist des Veranstalters – bei Bedarf ändern.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="optionNotiz" className="text-sm font-semibold">
              Notiz zur Option (optional)
            </label>
            <textarea
              id="optionNotiz"
              name="optionNotiz"
              rows={2}
              className="input"
            />
          </div>
        </div>
      )}

      {ausgewaehlterStatus === "GEBUCHT" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="buchungsweg" className="text-sm font-semibold">
            Buchungsweg *
          </label>
          <select
            id="buchungsweg"
            name="buchungsweg"
            defaultValue=""
            className="input"
          >
            <option value="" disabled>
              Bitte wählen
            </option>
            <option value="PERSOENLICH">Persönlich</option>
            <option value="SCHRIFTLICH">Schriftlich</option>
          </select>
        </div>
      )}

      {ausgewaehlterStatus === "VERLOREN" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="verlustgrund" className="text-sm font-semibold">
            Verlustgrund *
          </label>
          <input
            id="verlustgrund"
            name="verlustgrund"
            className="input"
          />
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      {state.ermutigung && (
        <p className="text-sm text-[var(--color-muted)] italic">
          {state.ermutigung}
        </p>
      )}

      {state.anerkennung && <AnerkennungToast text={state.anerkennung} />}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Speichern…" : "Status übernehmen"}
      </button>
    </form>
  );
}
