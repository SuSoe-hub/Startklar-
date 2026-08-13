"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  holeUngeleseneAnzahl,
  holeUngeleseneVorgaenge,
  holeOffeneKollegenNotizen,
  markiereBenachrichtigungenGelesen,
  erledigeKollegenNotiz,
} from "@/lib/actions";
import type {
  UngeleseneVorgang,
  OffeneKollegenNotiz,
} from "@/lib/benachrichtigung";
import { BERLIN_TZ } from "@/lib/zeit";

const POLL_INTERVALL_MS = 30_000;

export default function Glocke({ initialAnzahl }: { initialAnzahl: number }) {
  const [anzahl, setAnzahl] = useState(initialAnzahl);
  const [offen, setOffen] = useState(false);
  const [vorgaenge, setVorgaenge] = useState<UngeleseneVorgang[] | null>(null);
  const [notizen, setNotizen] = useState<OffeneKollegenNotiz[] | null>(null);
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
    const [vorgangsListe, notizenListe] = await Promise.all([
      holeUngeleseneVorgaenge(),
      holeOffeneKollegenNotizen(),
    ]);
    setVorgaenge(vorgangsListe);
    setNotizen(notizenListe);
    setLadeVorgaenge(false);

    if (vorgangsListe.length > 0) {
      await markiereBenachrichtigungenGelesen();
    }
    // Kollegen-Notizen zählen weiter mit, bis sie erledigt sind - "gesehen"
    // reicht hier nicht, siehe lib/benachrichtigung.ts.
    setAnzahl(notizenListe.length);
  }

  async function notizErledigen(notizId: string) {
    setNotizen((liste) => liste?.filter((n) => n.id !== notizId) ?? liste);
    setAnzahl((a) => Math.max(0, a - 1));
    await erledigeKollegenNotiz(notizId, { error: null }, new FormData());
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={umschalten}
        aria-label={anzahl > 0 ? `${anzahl} neue Benachrichtigungen` : "Benachrichtigungen"}
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

          <h3 className="text-sm font-semibold px-2 py-1 mt-2 text-[var(--color-muted)]">
            Notizen von Kolleg:innen
          </h3>
          {!ladeVorgaenge && notizen?.length === 0 && (
            <p className="text-sm px-2 py-2 text-[var(--color-muted)]">
              Keine offenen Notizen.
            </p>
          )}
          {!ladeVorgaenge &&
            notizen?.map((n) => (
              <div key={n.id} className="px-2 py-2 rounded-lg hover:bg-[var(--color-primary-50)]">
                <div className="text-sm font-semibold">
                  {n.kundenname}
                  {n.argusNummer && ` · Argus ${n.argusNummer}`}
                </div>
                <div className="text-sm">{n.text}</div>
                <div className="text-xs text-[var(--color-muted)] mt-0.5">
                  von {n.von.name} ·{" "}
                  {n.erstelltAm.toLocaleString("de-DE", {
                    timeZone: BERLIN_TZ,
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => notizErledigen(n.id)}
                  className="link text-xs mt-1"
                >
                  Erledigt
                </button>
              </div>
            ))}
          <Link
            href="/kollegen-notizen"
            onClick={() => setOffen(false)}
            className="block px-2 py-2 mt-1 text-xs link"
          >
            Alle Kollegen-Notizen →
          </Link>
        </div>
      )}
    </div>
  );
}
