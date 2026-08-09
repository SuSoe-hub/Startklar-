import { prisma } from "@/lib/prisma";
import {
  ampelFarbe,
  istArchiviertDurchInaktivitaet,
  istFaellig,
  istUnerledigteUeberfaelligeOption,
} from "@/lib/ampel";

export type UeberfaelligerFall = {
  kundeName: string;
  beraterName: string;
  istOption: boolean;
};

// Für die E-Mail-Erinnerung: nur die echt überfälligen Fälle (rot), nicht die
// heute-fälligen (gelb) - das deckt sich mit "überfällig" im Wortsinn. Eine
// Option zählt hier immer als eigene, besonders hervorzuhebende Kategorie,
// weil ein Versäumnis Geld kosten kann (siehe ampel.ts).
export async function sammleUeberfaelligeVorgaenge(
  jetzt: Date
): Promise<UeberfaelligerFall[]> {
  const vorgaenge = await prisma.vorgang.findMany({
    where: { status: { in: ["ANGEBOT_RAUS", "NACHFASSEN", "OPTION"] } },
    include: {
      kunde: true,
      berater: true,
      notizen: { orderBy: { erstelltAm: "desc" }, take: 1 },
    },
  });

  return vorgaenge
    .filter((v) => {
      const letzteAktivitaet = new Date(
        Math.max(
          v.erstelltAm.getTime(),
          v.updatedAt.getTime(),
          v.notizen[0]?.erstelltAm.getTime() ?? 0
        )
      );
      const dauerhaftAktiv = istUnerledigteUeberfaelligeOption(
        v.status,
        v.optionsfrist,
        jetzt
      );
      if (!dauerhaftAktiv && istArchiviertDurchInaktivitaet(letzteAktivitaet, jetzt)) {
        return false;
      }

      const kontaktUnvollstaendig = !(v.kunde.handynummer && v.kunde.email);
      const farbe = ampelFarbe({
        kontaktUnvollstaendig,
        wiedervorlage: v.wiedervorlage,
        optionsfrist: v.optionsfrist,
        jetzt,
      });
      return farbe === "rot";
    })
    .map((v) => ({
      kundeName: `${v.kunde.vorname} ${v.kunde.nachname}`,
      beraterName: v.berater.name,
      istOption: v.status === "OPTION",
    }));
}

// Dieselbe Zählung wie auf der Startseite (src/app/(app)/page.tsx), damit die
// Teams-Erinnerung und das Dashboard nie eine unterschiedliche Zahl anzeigen.
export async function zaehleFaelligeVorgaenge(jetzt: Date): Promise<number> {
  const vorgaenge = await prisma.vorgang.findMany({
    where: { status: { in: ["ANGEBOT_RAUS", "NACHFASSEN", "OPTION"] } },
    include: {
      kunde: true,
      notizen: { orderBy: { erstelltAm: "desc" }, take: 1 },
    },
  });

  return vorgaenge.filter((v) => {
    const letzteAktivitaet = new Date(
      Math.max(
        v.erstelltAm.getTime(),
        v.updatedAt.getTime(),
        v.notizen[0]?.erstelltAm.getTime() ?? 0
      )
    );
    const dauerhaftAktiv = istUnerledigteUeberfaelligeOption(
      v.status,
      v.optionsfrist,
      jetzt
    );
    if (!dauerhaftAktiv && istArchiviertDurchInaktivitaet(letzteAktivitaet, jetzt)) {
      return false;
    }

    const kontaktUnvollstaendig = !(v.kunde.handynummer && v.kunde.email);
    const farbe = ampelFarbe({
      kontaktUnvollstaendig,
      wiedervorlage: v.wiedervorlage,
      optionsfrist: v.optionsfrist,
      jetzt,
    });
    return istFaellig(farbe);
  }).length;
}
