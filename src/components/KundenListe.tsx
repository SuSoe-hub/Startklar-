"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";

type Kunde = {
  id: string;
  vorname: string;
  nachname: string;
  handynummer: string | null;
  email: string | null;
};

export default function KundenListe({ kunden }: { kunden: Kunde[] }) {
  const [suche, setSuche] = useState("");

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    if (!begriff) return kunden;
    return kunden.filter((k) => {
      const name = `${k.vorname} ${k.nachname}`.toLowerCase();
      return (
        name.includes(begriff) ||
        (k.handynummer ?? "").toLowerCase().includes(begriff) ||
        (k.email ?? "").toLowerCase().includes(begriff)
      );
    });
  }, [kunden, suche]);

  return (
    <>
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

      <p className="text-xs text-[var(--color-muted)] mb-2">
        Tipp: Umlaute ausschreiben – ü → ue, ä → ae, ö → oe (sonst findet
        Argus den Kunden beim Einfügen nicht).
      </p>

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
            : "Noch keine Kunden angelegt."}
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
                <div className="font-semibold">
                  {k.vorname} {k.nachname}
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
