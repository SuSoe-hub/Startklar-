import { prisma } from "@/lib/prisma";
import {
  ampelFarbe,
  istArchiviertDurchInaktivitaet,
  istFaellig,
  istUnerledigteUeberfaelligeOption,
} from "@/lib/ampel";

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
