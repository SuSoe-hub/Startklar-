"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import { enthaeltUmlaut } from "@/lib/umlaute";
import type { KundenBadge, KundenBadgeFarbe } from "@/lib/kundenstatus";

type Kunde = {
  id: string;
  vorname: string;
  nachname: string;
  handynummer: string | null;
  email: string | null;
  istErledigt: boolean;
  badge: KundenBadge;
};

const BADGE_STYLE: Record<KundenBadgeFarbe, string> = {
  rot: "text-red-700 bg-red-100",
  gelb: "text-amber-700 bg-amber-100",
  gruen: "text-green-700 bg-green-100",
  gebucht: "text-teal-700 bg-teal-100",
  verloren: "text-gray-600 bg-gray-100",
};

export default function KundenListe({ kunden }: { kunden: Kunde[] }) {
  const [suche, setSuche] = useState("");
  const [tab, setTab] = useState<"aktiv" | "erledigt">("aktiv");

  const nachTab = useMemo(
    () => kunden.filter((k) => (tab === "aktiv" ? !k.istErledigt : k.istErledigt)),
    [kunden, tab]
  );

  const aktivAnzahl = useMemo(() => kunden.filter((k) => !k.istErledigt).length, [kunden]);
  const erledigtAnzahl = kunden.length - aktivAnzahl;

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    if (!begriff) return nachTab;
    return nachTab.filter((k) => {
      const name = `${k.vorname} ${k.nachname}`.toLowerCase();
      return (
        name.includes(begriff) ||
        (k.handynummer ?? "").toLowerCase().includes(begriff) ||
        (k.email ?? "").toLowerCase().includes(begriff)
      );
    });
  }, [nachTab, suche]);

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
            : tab === "aktiv"
              ? "Keine aktiven Kunden."
              : "Noch keine erledigten Kunden."}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {gefiltert.map((k) => {
          const unvollstaendig = !(k.handynummer && k.email);
          return (
            <li key={k.id}>
              <Link
                href={`/kunden/${k.id}`}
                className={`card block p-4 hover:shadow-md transition-shadow ${
                  unvollstaendig
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
