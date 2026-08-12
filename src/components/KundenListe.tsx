"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import { enthaeltUmlaut } from "@/lib/umlaute";
import type { KundenBadge, KundenBadgeFarbe } from "@/lib/kundenstatus";

type KundeVorgang = {
  status: string;
  kanal: string;
  beraterId: string;
};

type Kunde = {
  id: string;
  vorname: string;
  nachname: string;
  handynummer: string | null;
  email: string | null;
  istErledigt: boolean;
  badge: KundenBadge;
  vorgaenge: KundeVorgang[];
};

type Mitarbeiter = { id: string; name: string };

const BADGE_STYLE: Record<KundenBadgeFarbe, string> = {
  rot: "text-red-700 bg-red-100",
  gelb: "text-amber-700 bg-amber-100",
  gruen: "text-green-700 bg-green-100",
  gebucht: "text-teal-700 bg-teal-100",
  verloren: "text-gray-600 bg-gray-100",
  erledigt: "text-slate-700 bg-slate-100",
};

const STATUS_LABEL: Record<string, string> = {
  ANGEBOT_RAUS: "Angebot raus",
  OPTION: "Option",
  NACHFASSEN: "Nachfassen",
  GEBUCHT: "Gebucht",
  VERLOREN: "Verloren",
  ERLEDIGT: "Erledigt",
};

const KANAL_LABEL: Record<string, string> = {
  EMAIL: "E-Mail",
  WHATSAPP: "WhatsApp",
  TELEFON: "Telefon",
  VOR_ORT: "Vor Ort",
};

export default function KundenListe({
  kunden,
  alleMitarbeiter,
}: {
  kunden: Kunde[];
  alleMitarbeiter: Mitarbeiter[];
}) {
  const [suche, setSuche] = useState("");
  const [tab, setTab] = useState<"aktiv" | "erledigt">("aktiv");
  const [status, setStatus] = useState("");
  const [kanal, setKanal] = useState("");
  const [beraterId, setBeraterId] = useState("");
  const filterAktiv = !!(status || kanal || beraterId);

  const nachTab = useMemo(
    () => kunden.filter((k) => (tab === "aktiv" ? !k.istErledigt : k.istErledigt)),
    [kunden, tab]
  );

  const aktivAnzahl = useMemo(() => kunden.filter((k) => !k.istErledigt).length, [kunden]);
  const erledigtAnzahl = kunden.length - aktivAnzahl;

  // Eine Option hat eine echte Frist und kann im Zweifel Geld kosten -
  // deshalb darf ein Kunde mit offener Option nie durch einen Filter aus der
  // Liste verschwinden (siehe StartseiteFilter.tsx für dieselbe Regel).
  //
  // Der "Erledigt"-Filter deckt neben dem echten Status ERLEDIGT auch
  // Gebucht und Verloren ab (gleiche Definition wie kundeIstErledigt in
  // kundenstatus.ts: alles außerhalb der offenen Stati).
  const nachFilter = useMemo(() => {
    if (!filterAktiv) return nachTab;
    return nachTab.filter((k) =>
      k.vorgaenge.some((v) => {
        const statusPasst =
          !status ||
          (status === "ERLEDIGT"
            ? v.status === "GEBUCHT" ||
              v.status === "VERLOREN" ||
              v.status === "ERLEDIGT"
            : v.status === status);
        return (
          v.status === "OPTION" ||
          (statusPasst &&
            (!kanal || v.kanal === kanal) &&
            (!beraterId || v.beraterId === beraterId))
        );
      })
    );
  }, [nachTab, filterAktiv, status, kanal, beraterId]);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    if (!begriff) return nachFilter;
    return nachFilter.filter((k) => {
      const name = `${k.vorname} ${k.nachname}`.toLowerCase();
      return (
        name.includes(begriff) ||
        (k.handynummer ?? "").toLowerCase().includes(begriff) ||
        (k.email ?? "").toLowerCase().includes(begriff)
      );
    });
  }, [nachFilter, suche]);

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("aktiv")}
          className={tab === "aktiv" ? "btn-primary" : "btn-secondary"}
        >
          Aktiv ({aktivAnzahl})
        </button>
        <button
          type="button"
          onClick={() => setTab("erledigt")}
          className={tab === "erledigt" ? "btn-primary" : "btn-secondary"}
        >
          Erledigt ({erledigtAnzahl})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
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

      <div className="flex items-center gap-2 mb-1">
        <div className="relative flex-1">
          <input
            type="text"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Name, Handynummer oder E-Mail..."
            className="input w-full pr-8"
          />
          {suche && (
            <button
              type="button"
              onClick={() => setSuche("")}
              aria-label="Suche leeren"
              title="Suche leeren"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-primary-600)] text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        {suche.trim() && <CopyButton value={suche.trim()} label="Sucheingabe" />}
      </div>

      {enthaeltUmlaut(suche) && (
        <p className="text-xs text-orange-700 mb-2">
          Tipp: Für Argus lieber ausschreiben – ü → ue, ä → ae, ö → oe, ß →
          ss (sonst findet Argus den Kunden beim Einfügen nicht).
        </p>
      )}

      <a
        href="https://office.go-suite.com/argus"
        target="argus-backoffice"
        className="link text-sm inline-block mb-4"
      >
        Hat der Kunde schon einmal gebucht? In Argus nachschauen →
      </a>

      {gefiltert.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          {suche
            ? "Kein Kunde gefunden."
            : filterAktiv
              ? "Kein Kunde für diese Filterauswahl."
              : tab === "aktiv"
                ? "Keine aktiven Kunden."
                : "Noch keine erledigten Kunden."}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {gefiltert.map((k) => {
          const unvollstaendig = !(k.handynummer && k.email);
          const istOption = k.vorgaenge.some((v) => v.status === "OPTION");
          return (
            <li key={k.id}>
              <Link
                href={`/kunden/${k.id}`}
                className={`card block p-4 hover:shadow-md transition-shadow ${
                  istOption
                    ? "border-l-4 border-l-red-500 bg-red-50/50"
                    : unvollstaendig
                      ? "border-l-4 border-l-orange-500 bg-orange-50/50"
                      : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">
                    {k.vorname} {k.nachname}
                  </div>
                  {k.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${BADGE_STYLE[k.badge.farbe]}`}
                    >
                      {k.badge.label}
                    </span>
                  )}
                </div>
                <div className="text-sm text-[var(--color-muted)] mt-0.5">
                  {k.handynummer ?? "—"} · {k.email ?? "—"}
                </div>
                {unvollstaendig && (
                  <div className="text-xs text-orange-700 mt-1 font-semibold">
                    Kontaktdaten unvollständig
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
