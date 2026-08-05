import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ampelFarbe, istFaellig } from "@/lib/ampel";
import { getEinstellungen } from "@/lib/einstellungen";
import { heutigesDatumString } from "@/lib/teampool";

// Startklar_Erweiterung_Anerkennung.md: kurze, freundliche Rückmeldungen bei
// bestimmten Anlässen. Bewusst kein Punkte-/Belohnungssystem – nichts wird
// gezählt oder in der Datenbank gespeichert. Die "höchstens 1 pro Tag"-Regel
// läuft über ein einfaches Browser-Cookie, das nach einem Tag verfällt.

type Anlass =
  | "ZEHN_HEUTE"
  | "ALLE_WIEDERVORLAGEN_ERLEDIGT"
  | "OPTION_RECHTZEITIG"
  | "UEBERNOMMEN"
  | "ERSTER_VORGANG"
  | "FUENFZIG_GESAMT";

const NACHRICHTEN: Record<Anlass, string[]> = {
  ZEHN_HEUTE: [
    "Wow, du warst heute richtig fleißig. Weiter so!",
    "Zehn Vorgänge an einem Tag – starke Leistung.",
  ],
  ALLE_WIEDERVORLAGEN_ERLEDIGT: [
    "Alles abgearbeitet – heute wartet kein Kunde.",
    "Liste leer – gut gemacht.",
  ],
  OPTION_RECHTZEITIG: [
    "Frist im Blick behalten. Sehr gut.",
    "Option rechtzeitig erledigt – Kopf frei.",
  ],
  UEBERNOMMEN: [
    "Danke, dass du eingesprungen bist.",
    "Gut, dass du übernommen hast.",
  ],
  ERSTER_VORGANG: ["Der erste Eintrag ist drin. Los geht's!"],
  FUENFZIG_GESAMT: ["50 Vorgänge erfasst – starke Bilanz!"],
};

function zufaelligeNachricht(anlass: Anlass) {
  const liste = NACHRICHTEN[anlass];
  return liste[Math.floor(Math.random() * liste.length)];
}

const COOKIE_MAX_ALTER_SEKUNDEN = 60 * 60 * 24;

async function heuteSchonGezeigt(mitarbeiterId: string, jetzt: Date) {
  const store = await cookies();
  return store.get(`anerkennung_${mitarbeiterId}`)?.value === heutigesDatumString(jetzt);
}

async function markiereGezeigt(mitarbeiterId: string, jetzt: Date) {
  const store = await cookies();
  store.set(`anerkennung_${mitarbeiterId}`, heutigesDatumString(jetzt), {
    maxAge: COOKIE_MAX_ALTER_SEKUNDEN,
    httpOnly: true,
    sameSite: "lax",
  });
}

async function pruefeUndMarkiere(
  mitarbeiterId: string,
  jetzt: Date,
  anlass: Anlass,
  bedingungErfuellt: () => Promise<boolean>
): Promise<string | null> {
  const einstellungen = await getEinstellungen();
  if (!einstellungen.smileysAktiviert) return null;
  if (await heuteSchonGezeigt(mitarbeiterId, jetzt)) return null;
  if (!(await bedingungErfuellt())) return null;

  await markiereGezeigt(mitarbeiterId, jetzt);
  return zufaelligeNachricht(anlass);
}

export async function pruefeErsterVorgang(mitarbeiterId: string, jetzt: Date) {
  return pruefeUndMarkiere(mitarbeiterId, jetzt, "ERSTER_VORGANG", async () => {
    const anzahl = await prisma.vorgang.count({
      where: { beraterId: mitarbeiterId },
    });
    return anzahl === 1;
  });
}

export async function pruefeFuenfzigVorgaenge(mitarbeiterId: string, jetzt: Date) {
  return pruefeUndMarkiere(mitarbeiterId, jetzt, "FUENFZIG_GESAMT", async () => {
    const anzahl = await prisma.vorgang.count({
      where: { beraterId: mitarbeiterId },
    });
    return anzahl === 50;
  });
}

export async function pruefeZehnVorgaengeHeute(mitarbeiterId: string, jetzt: Date) {
  return pruefeUndMarkiere(mitarbeiterId, jetzt, "ZEHN_HEUTE", async () => {
    const heuteStart = new Date(
      jetzt.getFullYear(),
      jetzt.getMonth(),
      jetzt.getDate()
    );
    const anzahl = await prisma.vorgang.count({
      where: { beraterId: mitarbeiterId, erstelltAm: { gte: heuteStart } },
    });
    return anzahl === 10;
  });
}

export async function pruefeAlleWiedervorlagenErledigt(
  mitarbeiterId: string,
  jetzt: Date
) {
  return pruefeUndMarkiere(
    mitarbeiterId,
    jetzt,
    "ALLE_WIEDERVORLAGEN_ERLEDIGT",
    async () => {
      const offene = await prisma.vorgang.findMany({
        where: {
          beraterId: mitarbeiterId,
          status: { in: ["ANGEBOT_RAUS", "NACHFASSEN", "OPTION"] },
        },
        include: { kunde: true },
      });
      if (offene.length === 0) return false;

      return !offene.some((v) => {
        const farbe = ampelFarbe({
          kontaktUnvollstaendig: !(v.kunde.handynummer && v.kunde.email),
          wiedervorlage: v.wiedervorlage,
          optionsfrist: v.optionsfrist,
          jetzt,
        });
        return istFaellig(farbe);
      });
    }
  );
}

export async function pruefeOptionRechtzeitig(
  mitarbeiterId: string,
  jetzt: Date,
  optionsfristVorAenderung: Date | null
) {
  return pruefeUndMarkiere(
    mitarbeiterId,
    jetzt,
    "OPTION_RECHTZEITIG",
    async () => !!optionsfristVorAenderung && optionsfristVorAenderung >= jetzt
  );
}

export async function pruefeUebernommen(mitarbeiterId: string, jetzt: Date) {
  return pruefeUndMarkiere(mitarbeiterId, jetzt, "UEBERNOMMEN", async () => true);
}
