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

// Notizen, die Kolleg:innen füreinander zu (meist bereits abgeschlossenen)
// Buchungen hinterlassen, die nicht als Vorgang in Startklar existieren.
// Anders als bei Vorgängen zählt hier nicht "seit zuletzt angeschaut",
// sondern "noch nicht erledigt" - die Notiz ist eine offene Aufgabe für
// die Empfängerin/den Empfänger, kein einmaliger Hinweis.
export function offeneKollegenNotizenWhere(mitarbeiterId: string) {
  return { fuerId: mitarbeiterId, erledigtAm: null } as const;
}

export async function zaehleOffeneKollegenNotizen(mitarbeiterId: string) {
  return prisma.kollegenNotiz.count({
    where: offeneKollegenNotizenWhere(mitarbeiterId),
  });
}

export type OffeneKollegenNotiz = {
  id: string;
  kundenname: string;
  argusNummer: string | null;
  text: string;
  erstelltAm: Date;
  von: { name: string };
};

export async function ladeOffeneKollegenNotizen(
  mitarbeiterId: string
): Promise<OffeneKollegenNotiz[]> {
  return prisma.kollegenNotiz.findMany({
    where: offeneKollegenNotizenWhere(mitarbeiterId),
    orderBy: { erstelltAm: "desc" },
    select: {
      id: true,
      kundenname: true,
      argusNummer: true,
      text: true,
      erstelltAm: true,
      von: { select: { name: true } },
    },
  });
}

// Läuft im Root-Layout auf jeder einzelnen Seite mit - ein Datenbank-Hänger
// hier darf niemals die ganze App unbenutzbar machen, deshalb wird ein
// Fehler abgefangen und die Glocke zeigt im Zweifel einfach 0 an, statt die
// komplette Seite mit hochzureißen.
export async function zaehleGlockenAnzahl(mitarbeiterId: string, seit: Date) {
  try {
    const [vorgaenge, notizen] = await Promise.all([
      zaehleUngeleseneVorgaenge(mitarbeiterId, seit),
      zaehleOffeneKollegenNotizen(mitarbeiterId),
    ]);
    return vorgaenge + notizen;
  } catch (error) {
    console.error("Glocke: Anzahl konnte nicht geladen werden.", error);
    return 0;
  }
}
