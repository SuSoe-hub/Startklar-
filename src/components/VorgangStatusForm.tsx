"use client";

import { useActionState, useEffect, useState } from "react";
import { updateVorgangStatus, type StatusFormState } from "@/lib/actions";

const initialState: StatusFormState = { error: null, ermutigung: null };

export default function VorgangStatusForm({
  vorgangId,
  status,
}: {
  vorgangId: string;
  status: string;
}) {
  const action = updateVorgangStatus.bind(null, vorgangId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [ausgewaehlterStatus, setAusgewaehlterStatus] = useState(status);

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
          <option value="NACHFASSEN">Nachfassen</option>
          <option value="GEBUCHT">Gebucht</option>
          <option value="VERLOREN">Verloren</option>
        </select>
      </div>

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

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Speichern…" : "Status übernehmen"}
      </button>
    </form>
  );
}
