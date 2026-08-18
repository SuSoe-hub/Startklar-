"use client";

import { useTransition } from "react";
import {
  markiereAnwesend,
  entferneAnwesend,
  beendeArbeitstag,
} from "@/lib/actions";
import { formatBerlinUhrzeit } from "@/lib/zeit";

const ORT_LABEL: Record<string, string> = {
  BUERO: "Büro",
  HOMEOFFICE: "Homeoffice",
};

export default function WerIstHeuteDa({
  aktuellerMitarbeiter,
  anwesenheit,
}: {
  aktuellerMitarbeiter: { id: string; name: string };
  anwesenheit: {
    ort: string | null;
    loginZeit: Date | null;
    logoutZeit: Date | null;
  } | null;
}) {
  const [pending, startTransition] = useTransition();

  function daImOrt(ort: "BUERO" | "HOMEOFFICE") {
    startTransition(() => {
      markiereAnwesend(aktuellerMitarbeiter.id, ort);
    });
  }

  function zuruecksetzen() {
    startTransition(() => {
      entferneAnwesend(aktuellerMitarbeiter.id);
    });
  }

  function feierabend() {
    startTransition(() => {
      beendeArbeitstag(aktuellerMitarbeiter.id);
    });
  }

  if (anwesenheit) {
    const istHomeoffice = anwesenheit.ort === "HOMEOFFICE";

    if (istHomeoffice && anwesenheit.logoutZeit) {
      return (
        <div className="card border-l-4 border-l-green-400 bg-green-50/60 p-4">
          <p className="text-sm font-semibold text-green-700">
            ✓ {aktuellerMitarbeiter.name} hat sich um{" "}
            {formatBerlinUhrzeit(anwesenheit.logoutZeit)} Uhr abgemeldet.
          </p>
        </div>
      );
    }

    const ortLabel = anwesenheit.ort ? ORT_LABEL[anwesenheit.ort] : null;
    return (
      <div className="card border-l-4 border-l-green-400 bg-green-50/60 p-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-green-700">
          ✓ {aktuellerMitarbeiter.name} ist heute da
          {ortLabel ? ` (${ortLabel})` : ""}.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {istHomeoffice && (
            <button
              type="button"
              onClick={feierabend}
              disabled={pending}
              className="btn-primary"
            >
              {pending ? "…" : "Feierabend"}
            </button>
          )}
          <button
            type="button"
            onClick={zuruecksetzen}
            disabled={pending}
            className="text-xs link"
          >
            Doch nicht? Rückgängig machen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-l-4 border-l-[var(--color-primary-400)] bg-[var(--color-primary-50)]/60 p-4 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-sm font-semibold">Bist du heute da?</p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => daImOrt("BUERO")}
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "…" : "Ja, im Büro"}
        </button>
        <button
          type="button"
          onClick={() => daImOrt("HOMEOFFICE")}
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "…" : "Ja, im Homeoffice"}
        </button>
      </div>
    </div>
  );
}
