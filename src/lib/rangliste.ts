import { prisma } from "@/lib/prisma";

export type RanglistenEintrag = {
  mitarbeiterId: string;
  name: string;
  anzahl: number;
};

export const UEBERRASCHUNG_SCHWELLE = 50;

export type UeberraschungsEintrag = {
  mitarbeiterId: string;
  name: string;
  anzahlGesamt: number;
  erreicht: boolean;
};

export function monatsStart(jetzt: Date): Date {
  return new Date(jetzt.getFullYear(), jetzt.getMonth(), 1);
}

// Zeigt jede:n Mitarbeiter:in, auch mit 0 Vorgängen diesem Monat - eine
// offene, für alle sichtbare Liste (Motivation/Konkurrenz), setzt sich
// jeden Monat zurück.
export async function berechneRangliste(jetzt: Date): Promise<RanglistenEintrag[]> {
  const [gruppen, alleMitarbeiter] = await Promise.all([
    prisma.vorgang.groupBy({
      by: ["beraterId"],
      _count: { _all: true },
      where: { erstelltAm: { gte: monatsStart(jetzt) } },
    }),
    prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
  ]);

  const anzahlByMitarbeiterId = new Map(
    gruppen.map((g) => [g.beraterId, g._count._all])
  );

  return alleMitarbeiter
    .map((m) => ({
      mitarbeiterId: m.id,
      name: m.name,
      anzahl: anzahlByMitarbeiterId.get(m.id) ?? 0,
    }))
    .sort((a, b) => b.anzahl - a.anzahl);
}

// Lebenslanger Fortschritt bis zur 50er-Überraschung (siehe
// pruefeFuenfzigVorgaenge in anerkennung.ts) – bewusst nicht monatlich, im
// Gegensatz zur Rangliste oben, da die Überraschung ein einmaliger,
// dauerhafter Meilenstein ist.
export async function berechneUeberraschungsFortschritt(): Promise<
  UeberraschungsEintrag[]
> {
  const [gruppen, alleMitarbeiter] = await Promise.all([
    prisma.vorgang.groupBy({ by: ["beraterId"], _count: { _all: true } }),
    prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
  ]);

  const anzahlByMitarbeiterId = new Map(
    gruppen.map((g) => [g.beraterId, g._count._all])
  );

  return alleMitarbeiter
    .map((m) => {
      const anzahlGesamt = anzahlByMitarbeiterId.get(m.id) ?? 0;
      return {
        mitarbeiterId: m.id,
        name: m.name,
        anzahlGesamt,
        erreicht: anzahlGesamt >= UEBERRASCHUNG_SCHWELLE,
      };
    })
    .sort((a, b) => b.anzahlGesamt - a.anzahlGesamt);
}
