"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UebernahmeForm from "@/components/UebernahmeForm";
import type { AmpelFarbe } from "@/lib/ampel";
import { BERLIN_TZ } from "@/lib/zeit";

const OPTIONSART_BADGE_LABEL: Record<string, string> = {
  KUNDENOPTION: "Kundenoption",
  INTERN: "intern",
};

const KANAL_LABEL: Record<string, string> = {
  EMAIL: "E-Mail",
  WHATSAPP: "WhatsApp",
  TELEFON: "Telefon",
  VOR_ORT: "Vor Ort",
};

const STATUS_LABEL: Record<string, string> = {
  ANGEBOT_RAUS: "Angebot raus",
  OPTION: "Option",
  NACHFASSEN: "Nachfassen",
};

const FARBE_STYLE: Record<AmpelFarbe, string> = {
  rot: "border-l-4 border-l-red-500 bg-red-50/50",
  gelb: "border-l-4 border-l-amber-500 bg-amber-50/50",
  orange: "border-l-4 border-l-orange-500 bg-orange-50/50",
  gruen: "border-l-4 border-l-green-500 bg-green-50/50",
  keine: "border-l-4 border-l-gray-300",
};

const FARBE_BADGE: Record<AmpelFarbe, string> = {
  rot: "text-red-700 bg-red-100",
  gelb: "text-amber-700 bg-amber-100",
  orange: "text-orange-700 bg-orange-100",
  gruen: "text-green-700 bg-green-100",
  keine: "text-gray-500 bg-gray-100",
};

const FARBE_LABEL: Record<AmpelFarbe, string> = {
  rot: "Überfällig",
  gelb: "Heute fällig",
  orange: "Kontaktdaten unvollständig",
  gruen: "Läuft",
  keine: "Keine Wiedervorlage",
};

export type EintragVorgang = {
  id: string;
  status: string;
  kanal: string;
  beraterId: string;
  optionsArt: string | null;
  optionVorgangsnummer: string | null;
  optionVeranstalter: { code: string } | null;
  optionVeranstalterSonstige: string | null;
  optionsfrist: Date | null;
  wiedervorlage: Date | null;
  kunde: { vorname: string; nachname: string };
  berater: { id: string; name: string };
};

type Eintrag = { v: EintragVorgang; farbe: AmpelFarbe };

type Mitarbeiter = { id: string; name: string };

export default function StartseiteFilter({
  poolEintraege,
  normaleEintraege,
  anwesendeMitarbeiter,
  alleMitarbeiter,
}: {
  poolEintraege: Eintrag[];
  normaleEintraege: Eintrag[];
  anwesendeMitarbeiter: Mitarbeiter[];
  alleMitarbeiter: Mitarbeiter[];
}) {
  const [status, setStatus] = useState("");
  const [kanal, setKanal] = useState("");
  const [beraterId, setBeraterId] = useState("");

  const filterAktiv = !!(status || kanal || beraterId);

  // Eine Option hat eine echte Frist und kann im Zweifel Geld kosten (siehe
  // ampel.ts) - deshalb darf sie nie durch einen Filter aus der Liste
  // verschwinden, egal welcher Status/Kanal/Berater gerade ausgewählt ist.
  const poolGefiltert = useMemo(
    () =>
      poolEintraege.filter(
        ({ v }) =>
          v.status === "OPTION" ||
          ((!status || v.status === status) &&
            (!kanal || v.kanal === kanal) &&
            (!beraterId || v.beraterId === beraterId))
      ),
    [poolEintraege, status, kanal, beraterId]
  );
  const normaleGefiltert = useMemo(
    () =>
      normaleEintraege.filter(
        ({ v }) =>
          v.status === "OPTION" ||
          ((!status || v.status === status) &&
            (!kanal || v.kanal === kanal) &&
            (!beraterId || v.beraterId === beraterId))
      ),
    [normaleEintraege, status, kanal, beraterId]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input w-auto text-sm"
          aria-label="Nach Status filtern"
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABEL).map(([wert, label]) => (
            <option key={wert} value={wert}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={kanal}
          onChange={(e) => setKanal(e.target.value)}
          className="input w-auto text-sm"
          aria-label="Nach Kanal filtern"
        >
          <option value="">Alle Kanäle</option>
          {Object.entries(KANAL_LABEL).map(([wert, label]) => (
            <option key={wert} value={wert}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={beraterId}
          onChange={(e) => setBeraterId(e.target.value)}
          className="input w-auto text-sm"
          aria-label="Nach Berater filtern"
        >
          <option value="">Alle Berater</option>
          {alleMitarbeiter.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {filterAktiv && (
          <button
            type="button"
            onClick={() => {
              setStatus("");
              setKanal("");
              setBeraterId("");
            }}
            className="link text-sm"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {poolGefiltert.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-muted)] mb-2">
            Heute unbetreut – {poolGefiltert.length} Kunde
            {poolGefiltert.length === 1 ? "" : "n"} warten
          </h2>
          <ul className="flex flex-col gap-2 mb-2">
            {poolGefiltert.map(({ v, farbe }) => (
              <li key={v.id} className={`card p-4 ${FARBE_STYLE[farbe]}`}>
                <Link href={`/vorgaenge/${v.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {v.kunde.vorname} {v.kunde.nachname}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FARBE_BADGE[farbe]}`}
                    >
                      {FARBE_LABEL[farbe]}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--color-muted)] mt-0.5">
                    {KANAL_LABEL[v.kanal]} · eigentlich {v.berater.name}
                  </div>
                </Link>
                <UebernahmeForm vorgangId={v.id} anwesende={anwesendeMitarbeiter} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {normaleGefiltert.length === 0 && poolGefiltert.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          {filterAktiv
            ? "Keine Vorgänge für diese Filterauswahl."
            : "Keine offenen Vorgänge. Alles erledigt oder noch nichts angelegt."}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {normaleGefiltert.map(({ v, farbe }) => {
          // Eine Option ist immer termingebunden und kostet im Zweifel Geld –
          // deshalb fällt sie auch weit vor ihrer Frist schon durch Rot auf,
          // statt wie eine normale Wiedervorlage erst kurz vorher gelb/rot zu
          // werden.
          const istOption = v.status === "OPTION";
          const stilFarbe: AmpelFarbe = istOption ? "rot" : farbe;
          const badgeLabel = istOption
            ? OPTIONSART_BADGE_LABEL[v.optionsArt ?? ""]
            : FARBE_LABEL[farbe];

          return (
            <li key={v.id}>
              <Link
                href={`/vorgaenge/${v.id}`}
                className={`card block p-4 hover:shadow-md transition-shadow ${FARBE_STYLE[stilFarbe]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {v.kunde.vorname} {v.kunde.nachname}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FARBE_BADGE[stilFarbe]}`}
                  >
                    {badgeLabel}
                  </span>
                </div>
                <div className="text-sm text-[var(--color-muted)] mt-0.5">
                  {KANAL_LABEL[v.kanal]} · {v.berater.name}
                  {istOption && v.optionsfrist
                    ? ` · Optionsfrist: ${v.optionsfrist.toLocaleString("de-DE", {
                        timeZone: BERLIN_TZ,
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : v.wiedervorlage &&
                      ` · Wiedervorlage: ${v.wiedervorlage.toLocaleString("de-DE", {
                        timeZone: BERLIN_TZ,
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
