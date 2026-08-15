"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { holeUngeleseneAnzahl } from "@/lib/actions";

// 2 Minuten statt der ursprünglichen 30 Sekunden: Bei 7 Mitarbeitern mit
// offener App über einen ganzen Arbeitstag verursacht jeder Poll 2
// DB-Operationen (zaehleGlockenAnzahl) - 30s hätte trotz dieses
// Zwei-Instanzen-Fixes noch ca. 295K Operationen/Monat verursacht, deutlich
// über dem 100K-Limit des Prisma Free Plans (siehe Ausfall August 2026).
const POLL_INTERVALL_MS = 120_000;

const GlockenContext = createContext<{
  anzahl: number;
  setAnzahl: Dispatch<SetStateAction<number>>;
} | null>(null);

// Desktop- und Mobile-Glocke sind beide gleichzeitig im DOM (nur per CSS
// versteckt, siehe layout.tsx) - ohne diesen gemeinsamen Provider hätte jede
// ihr eigenes 30-Sekunden-Polling und würde die Server-Anfragen verdoppeln
// (Ursache für das erreichte Prisma-Monatslimit im August).
export function GlockeProvider({
  initialAnzahl,
  children,
}: {
  initialAnzahl: number;
  children: React.ReactNode;
}) {
  const [anzahl, setAnzahl] = useState(initialAnzahl);

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

  return (
    <GlockenContext.Provider value={{ anzahl, setAnzahl }}>
      {children}
    </GlockenContext.Provider>
  );
}

export function useGlockenAnzahl() {
  const ctx = useContext(GlockenContext);
  if (!ctx) {
    throw new Error("useGlockenAnzahl muss innerhalb von GlockeProvider verwendet werden.");
  }
  return ctx;
}
