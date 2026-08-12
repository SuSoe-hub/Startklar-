import { prisma } from "@/lib/prisma";

// Ein Vorgang gilt für einen Mitarbeiter als ungelesene Benachrichtigung,
// wenn er als Berater eingetragen ist, ihn aber jemand anders angelegt hat
// (oder der/die Erstellende unbekannt ist) und das nach seinem letzten
// "gelesen"-Zeitpunkt passiert ist.
export function ungeleseneVorgaengeWhere(mitarbeiterId: string, seit: Date) {
  return {
    beraterId: mitarbeiterId,
    erstelltVonId: { not: mitarbeiterId },
    erstelltAm: { gt: seit },
  } as const;
}

export async function zaehleUngeleseneVorgaenge(
  mitarbeiterId: string,
  seit: Date
) {
  return prisma.vorgang.count({
    where: ungeleseneVorgaengeWhere(mitarbeiterId, seit),
  });
}

export type UngeleseneVorgang = {
  id: string;
  erstelltAm: Date;
  kunde: { vorname: string; nachname: string };
  erstelltVon: { name: string } | null;
};

export async function ladeUngeleseneVorgaenge(
  mitarbeiterId: string,
  seit: Date
): Promise<UngeleseneVorgang[]> {
  return prisma.vorgang.findMany({
    where: ungeleseneVorgaengeWhere(mitarbeiterId, seit),
    orderBy: { erstelltAm: "desc" },
    select: {
      id: true,
      erstelltAm: true,
      kunde: { select: { vorname: true, nachname: true } },
      erstelltVon: { select: { name: true } },
    },
  });
}
