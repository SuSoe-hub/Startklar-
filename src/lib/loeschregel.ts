import { prisma } from "@/lib/prisma";
import { OFFENE_STATI_LISTE } from "@/lib/kundenstatus";

// Susannas Entscheidung (2026-08-18): abgeschlossene Kunden (alle Vorgänge
// Gebucht/Verloren/Erledigt) werden 3 Jahre aufbewahrt, gerechnet ab der
// letzten Aktivität (jüngste Vorgangs-Aktualisierung oder Notiz). Danach
// dürfen sie hart gelöscht werden - konsistent mit dem bestehenden
// Löschkonzept (kein Anonymisierungspfad, siehe deleteKunde in actions.ts),
// da die eigentliche Buchung/Rechnung ohnehin dauerhaft in Argus liegt.
const AUFBEWAHRUNG_TAGE = 3 * 365;

async function ladeAbgeschlosseneKandidaten() {
  return prisma.kunde.findMany({
    where: {
      vorgaenge: { some: {} },
      NOT: { vorgaenge: { some: { status: { in: [...OFFENE_STATI_LISTE] } } } },
    },
    select: {
      id: true,
      vorname: true,
      nachname: true,
      vorgaenge: {
        select: {
          updatedAt: true,
          notizen: { select: { erstelltAm: true }, orderBy: { erstelltAm: "desc" }, take: 1 },
        },
      },
    },
  });
}

function letzteAktivitaet(vorgaenge: { updatedAt: Date; notizen: { erstelltAm: Date }[] }[]) {
  return new Date(
    Math.max(...vorgaenge.map((v) => Math.max(v.updatedAt.getTime(), v.notizen[0]?.erstelltAm.getTime() ?? 0)))
  );
}

export async function findeZurLoeschungFaelligeKunden(jetzt: Date) {
  const grenze = new Date(jetzt);
  grenze.setDate(grenze.getDate() - AUFBEWAHRUNG_TAGE);

  const kandidaten = await ladeAbgeschlosseneKandidaten();
  return kandidaten.filter((k) => letzteAktivitaet(k.vorgaenge) < grenze);
}

export async function loescheAbgelaufeneKunden(jetzt: Date) {
  const faellig = await findeZurLoeschungFaelligeKunden(jetzt);

  for (const k of faellig) {
    await prisma.$transaction([
      prisma.notiz.deleteMany({ where: { vorgang: { kundeId: k.id } } }),
      prisma.vorgang.deleteMany({ where: { kundeId: k.id } }),
      prisma.kunde.delete({ where: { id: k.id } }),
    ]);
  }

  return { anzahl: faellig.length };
}
