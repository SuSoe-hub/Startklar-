"use client";

import { useActionState, useEffect, useState } from "react";
import { createVorgang, type VorgangFormState } from "@/lib/actions";

const initialState: VorgangFormState = { error: null };

function jetztPlus24hLocal() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function VorgangForm({
  kundeId,
  mitarbeiter,
}: {
  kundeId: string;
  mitarbeiter: { id: string; name: string }[];
}) {
  const action = createVorgang.bind(null, kundeId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [wiedervorlage, setWiedervorlage] = useState("");

  useEffect(() => {
    // Zeitbasierter Default darf nicht beim Server-Render entstehen
    // (Server- und Client-Uhrzeit würden auseinanderlaufen), daher hier
    // bewusst erst nach dem Mount gesetzt.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWiedervorlage(jetztPlus24hLocal());
  }, []);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1">
        <label htmlFor="beraterId" className="text-sm font-semibold">
          Berater *
        </label>
        <select
          id="beraterId"
          name="beraterId"
          required
          defaultValue=""
          className="input"
        >
          <option value="" disabled>
            Bitte wählen
          </option>
          {mitarbeiter.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="kanal" className="text-sm font-semibold">
          Kanal *
        </label>
        <select
          id="kanal"
          name="kanal"
          required
          defaultValue=""
          className="input"
        >
          <option value="" disabled>
            Bitte wählen
          </option>
          <option value="EMAIL">E-Mail</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="TELEFON">Telefon</option>
          <option value="VOR_ORT">Vor Ort</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="wiedervorlage" className="text-sm font-semibold">
          Wiedervorlage
        </label>
        <input
          id="wiedervorlage"
          name="wiedervorlage"
          type="datetime-local"
          value={wiedervorlage}
          onChange={(e) => setWiedervorlage(e.target.value)}
          className="input"
        />
        <p className="text-xs text-[var(--color-muted)]">
          Standard: 24 Stunden ab jetzt. Manuell änderbar.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notiz" className="text-sm font-semibold">
          Notiz (optional)
        </label>
        <textarea
          id="notiz"
          name="notiz"
          rows={3}
          className="input"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Speichern…" : "Vorgang anlegen"}
      </button>
    </form>
  );
}
