"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  holeUngeleseneAnzahl,
  holeUngeleseneVorgaenge,
  markiereBenachrichtigungenGelesen,
} from "@/lib/actions";
import type { UngeleseneVorgang } from "@/lib/benachrichtigung";
import { BERLIN_TZ } from "@/lib/zeit";

const POLL_INTERVALL_MS = 30_000;

export default function Glocke({ initialAnzahl }: { initialAnzahl: number }) {
  const [anzahl, setAnzahl] = useState(initialAnzahl);
  const [offen, setOffen] = useState(false);
  const [vorgaenge, setVorgaenge] = useState<UngeleseneVorgang[] | null>(null);
  const [ladeVorgaenge, setLadeVorgaenge] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Solange die Seite offen ist, regelmäßig neu abfragen - Server-Actions
  // sind hier einfacher als ein eigener WebSocket-/SSE-Server, kommen aber
  // erst mit der nächsten Abfrage an, nicht sofort.
  useEffect(() => {
    let abgebrochen = false;
    const aktualisieren = () => {
      holeUngeleseneAnzahl().then((n) => {
        if (!abgebrochen) setAnzahl(n);
      });
    };
    const intervall = setInterval(aktualisieren, POLL_INTERVALL_MS);
    return () => {
      abgebrochen = true;
      clearInterval(intervall);
    };
  }, []);

  useEffect(() => {
    if (!offen) return;
    const aufKlickAussen = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffen(false);
      }
    };
    document.addEventListener("mousedown", aufKlickAussen);
    return () => document.removeEventListener("mousedown", aufKlickAussen);
  }, [offen]);

  async function umschalten() {
    const wirdGeoeffnet = !offen;
    setOffen(wirdGeoeffnet);
    if (!wirdGeoeffnet) return;

    setLadeVorgaenge(true);
    const liste = await holeUngeleseneVorgaenge();
    setVorgaenge(liste);
    setLadeVorgaenge(false);

    if (liste.length > 0) {
      await markiereBenachrichtigungenGelesen();
      setAnzahl(0);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={umschalten}
        aria-label={anzahl > 0 ? `${anzahl} neue Vorgänge` : "Benachrichtigungen"}
        className="relative p-2 -m-2 rounded-full hover:bg-[var(--color-primary-50)] text-xl leading-none"
      >
        🔔
        {anzahl > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
            {anzahl > 9 ? "9+" : anzahl}
          </span>
        )}
      </button>

      {offen && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto card p-2 shadow-lg z-30 bg-white">
          <h3 className="text-sm font-semibold px-2 py-1 text-[var(--color-muted)]">
            Neue Vorgänge
          </h3>
          {ladeVorgaenge && (
            <p className="text-sm px-2 py-2 text-[var(--color-muted)]">Lädt…</p>
          )}
          {!ladeVorgaenge && vorgaenge?.length === 0 && (
            <p className="text-sm px-2 py-2 text-[var(--color-muted)]">
              Keine neuen Vorgänge.
            </p>
          )}
          {!ladeVorgaenge &&
            vorgaenge?.map((v) => (
              <Link
                key={v.id}
                href={`/vorgaenge/${v.id}`}
                onClick={() => setOffen(false)}
                className="block px-2 py-2 rounded-lg hover:bg-[var(--color-primary-50)]"
              >
                <div className="text-sm font-semibold">
                  {v.kunde.vorname} {v.kunde.nachname}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {v.erstelltVon ? `von ${v.erstelltVon.name}` : "neu angelegt"} ·{" "}
                  {v.erstelltAm.toLocaleString("de-DE", {
                    timeZone: BERLIN_TZ,
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
