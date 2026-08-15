"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  holeUngeleseneVorgaenge,
  holeOffeneKollegenNotizen,
  markiereBenachrichtigungenGelesen,
  erledigeKollegenNotiz,
} from "@/lib/actions";
import { useGlockenAnzahl } from "@/components/GlockeProvider";
import type {
  UngeleseneVorgang,
  OffeneKollegenNotiz,
} from "@/lib/benachrichtigung";
import { BERLIN_TZ } from "@/lib/zeit";

export default function Glocke({
  menuAlign = "right",
}: {
  // In der schmalen Desktop-Seitenleiste sitzt die Glocke nah am linken
  // Bildschirmrand - ein rechtsbündiges Menü würde dort über den Rand
  // hinausragen und links abgeschnitten wirken. "left" öffnet es stattdessen
  // nach rechts in den Hauptbereich hinein.
  menuAlign?: "left" | "right";
}) {
  const { anzahl, setAnzahl } = useGlockenAnzahl();
  const [offen, setOffen] = useState(false);
  const [vorgaenge, setVorgaenge] = useState<UngeleseneVorgang[] | null>(null);
  const [notizen, setNotizen] = useState<OffeneKollegenNotiz[] | null>(null);
  const [ladeVorgaenge, setLadeVorgaenge] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        <div
          className={`absolute ${
            menuAlign === "left" ? "left-0" : "right-0"
          } mt-2 w-72 max-h-96 overflow-y-auto card p-2 shadow-lg z-30 bg-white`}
        >
          {ladeVorgaenge && (
            <p className="text-sm px-2 py-2 text-[var(--color-muted)]">Lädt…</p>
          )}

          {!ladeVorgaenge && !!vorgaenge?.length && (
            <>
              <h3 className="text-sm font-semibold px-2 py-1 text-[var(--color-muted)]">
                Neue Vorgänge
              </h3>
              {vorgaenge.map((v) => (
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
            </>
          )}

          {!ladeVorgaenge && !!notizen?.length && (
            <>
              <h3 className="text-sm font-semibold px-2 py-1 mt-2 text-[var(--color-muted)]">
                Notizen von Kolleg:innen
              </h3>
              {notizen.map((n) => (
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
            </>
          )}
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
