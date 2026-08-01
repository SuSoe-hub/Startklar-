import { prisma } from "@/lib/prisma";
import {
  ampelFarbe,
  istArchiviertDurchInaktivitaet,
  istFaellig,
} from "@/lib/ampel";

// Dieselbe Zählung wie auf der Startseite (src/app/(app)/page.tsx), damit die
// Teams-Erinnerung und das Dashboard nie eine unterschiedliche Zahl anzeigen.
export async function zaehleFaelligeVorgaenge(jetzt: Date): Promise<number> {
  const vorgaenge = await prisma.vorgang.findMany({
    where: { status: { in: ["ANGEBOT_RAUS", "NACHFASSEN"] } },
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
    if (istArchiviertDurchInaktivitaet(letzteAktivitaet, jetzt)) return false;

    const kontaktUnvollstaendig = !(v.kunde.handynummer && v.kunde.email);
    const farbe = ampelFarbe({
      kontaktUnvollstaendig,
      wiedervorlage: v.wiedervorlage,
      jetzt,
    });
    return istFaellig(farbe);
  }).length;
}
