"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import { updateVorgangStatus, type StatusFormState } from "@/lib/actions";
import AnerkennungToast from "@/components/AnerkennungToast";

export default function VorgangStatusForm({
  vorgangId,
  status,
  buchungsweg,
  verlustgrund,
  veranstalter,
  vorschlagOptionsfrist,
}: {
  vorgangId: string;
  status: string;
  buchungsweg: string | null;
  verlustgrund: string | null;
  veranstalter: { id: string; code: string }[];
  vorschlagOptionsfrist: string;
}) {
  const action = updateVorgangStatus.bind(null, vorgangId);
  const initialState: StatusFormState = {
    error: null,
    ermutigung: null,
    anerkennung: null,
    status,
    buchungsweg,
    verlustgrund,
  };
  const [state, formAction, pending] = useActionState(action, initialState);

  const [ausgewaehlterStatus, setAusgewaehlterStatus] = useState(status);
  const [optionsArt, setOptionsArt] = useState("KUNDENOPTION");
  const [vorgangsnummer, setVorgangsnummer] = useState("");
  const [veranstalterId, setVeranstalterId] = useState("");
  const [gewaehlterBuchungsweg, setGewaehlterBuchungsweg] = useState(
    buchungsweg ?? ""
  );
  const [gewaehlterVerlustgrund, setGewaehlterVerlustgrund] = useState(
    verlustgrund ?? ""
  );

  const statusRef = useRef<HTMLSelectElement>(null);
  const buchungswegRef = useRef<HTMLSelectElement>(null);
  const veranstalterRef = useRef<HTMLSelectElement>(null);
  const vorgangsnummerRef = useRef<HTMLInputElement>(null);
  const verlustgrundRef = useRef<HTMLInputElement>(null);

  // Eine Anerkennungs-Meldung (z.B. "Alles abgearbeitet") ist ein optionaler
  // Bonus, kein Ersatz für die eigentliche Speicherbestätigung – ohne
  // Anerkennung gab es sonst gar keine Rückmeldung, dass der Status
  // tatsächlich gespeichert wurde.
  const istErsterRender = useRef(true);
  const [zeigeGespeichert, setZeigeGespeichert] = useState(false);
  useEffect(() => {
    if (istErsterRender.current) {
      istErsterRender.current = false;
      return;
    }
    if (state.error) return;
    setZeigeGespeichert(true);
    const timer = setTimeout(() => setZeigeGespeichert(false), 3000);
    return () => clearTimeout(timer);
  }, [state]);

  // Hält die Auswahl mit dem persistierten Wert synchron, wenn er sich von
  // außen ändert (z. B. ein anderer Tab hat den Status geändert).
  useEffect(() => {
    setAusgewaehlterStatus(status);
  }, [status]);
  useEffect(() => {
    setGewaehlterBuchungsweg(buchungsweg ?? "");
  }, [buchungsweg]);
  useEffect(() => {
    setGewaehlterVerlustgrund(verlustgrund ?? "");
  }, [verlustgrund]);

  // React/Next setzen das native <form>-Element nach jeder Server Action
  // zurück – auch bei einem Validierungsfehler. Dadurch können kontrollierte
  // <select>/<input>-Elemente optisch von ihrem eigentlichen React-Wert
  // abweichen (der Status-Select zeigt z. B. wieder "Angebot raus", obwohl
  // "Option" ausgewählt war und die zugehörigen Felder weiter angezeigt
  // werden). `state` ändert bei jedem Abschluss der Aktion seine Referenz,
  // daher hier hart nach jeder Aktion den DOM-Wert erzwingen.
  useLayoutEffect(() => {
    setAusgewaehlterStatus(state.status);
    setGewaehlterBuchungsweg(state.buchungsweg ?? "");
    setGewaehlterVerlustgrund(state.verlustgrund ?? "");
    if (statusRef.current) statusRef.current.value = state.status;
    if (buchungswegRef.current) {
      buchungswegRef.current.value = state.buchungsweg ?? "";
    }
    if (verlustgrundRef.current) {
      verlustgrundRef.current.value = state.verlustgrund ?? "";
    }
    // Veranstalter/Vorgangsnummer werden serverseitig nicht gespeichert
    // zurückgegeben (nur bei Erfolg über den geänderten `status`), bei einem
    // Fehler bleiben sie unverändert stehen, damit nichts Getipptes verloren
    // geht.
    if (veranstalterRef.current) veranstalterRef.current.value = veranstalterId;
    if (vorgangsnummerRef.current) vorgangsnummerRef.current.value = vorgangsnummer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-sm font-semibold">
          Status
        </label>
        <select
          id="status"
          name="status"
          ref={statusRef}
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
              ref={vorgangsnummerRef}
              value={vorgangsnummer}
              onChange={(e) => setVorgangsnummer(e.target.value)}
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
              ref={veranstalterRef}
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
            ref={buchungswegRef}
            value={gewaehlterBuchungsweg}
            onChange={(e) => setGewaehlterBuchungsweg(e.target.value)}
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
            ref={verlustgrundRef}
            value={gewaehlterVerlustgrund}
            onChange={(e) => setGewaehlterVerlustgrund(e.target.value)}
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

      {zeigeGespeichert && !state.error && (
        <p className="text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
          Status gespeichert.
        </p>
      )}

      {state.anerkennung && <AnerkennungToast text={state.anerkennung} />}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Speichern…" : "Status übernehmen"}
      </button>
    </form>
  );
}
