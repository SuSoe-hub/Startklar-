import { BERLIN_TZ } from "@/lib/zeit";

type VorgangFuerStatistik = {
  status: string;
  erstelltAm: Date;
  updatedAt: Date;
};

export function kundenStatistik(
  vorgaenge: VorgangFuerStatistik[],
  jetzt: Date
) {
  const jahr = jetzt.getFullYear();

  const gesamt = vorgaenge.length;
  const imLaufendenJahr = vorgaenge.filter(
    (v) => v.erstelltAm.getFullYear() === jahr
  ).length;
  const gebucht = vorgaenge.filter((v) => v.status === "GEBUCHT");
  const verloren = vorgaenge.filter((v) => v.status === "VERLOREN").length;
  const erledigt = vorgaenge.filter((v) => v.status === "ERLEDIGT").length;
  const offen = vorgaenge.filter(
    (v) =>
      v.status === "ANGEBOT_RAUS" ||
      v.status === "NACHFASSEN" ||
      v.status === "OPTION"
  ).length;

  const letzteBuchung = gebucht
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

  return {
    gesamt,
    imLaufendenJahr,
    gebucht: gebucht.length,
    verloren,
    erledigt,
    offen,
    letzteBuchungAm: letzteBuchung?.updatedAt ?? null,
  };
}

const ZWOELF_MONATE_MS = 365 * 24 * 60 * 60 * 1000;

function ohneBuchungLetzte12Monate<T extends VorgangFuerStatistik>(
  vorgaenge: T[],
  jetzt: Date
) {
  const grenze = new Date(jetzt.getTime() - ZWOELF_MONATE_MS);
  return vorgaenge.filter(
    (v) => v.status !== "GEBUCHT" && v.erstelltAm >= grenze
  );
}

export function anfragenOhneBuchungLetzte12Monate(
  vorgaenge: VorgangFuerStatistik[],
  jetzt: Date
) {
  return ohneBuchungLetzte12Monate(vorgaenge, jetzt).length;
}

type VorgangMitBerater = VorgangFuerStatistik & { berater: { name: string } };

export function wiederholteAnfrageHinweisDaten(
  vorgaenge: VorgangMitBerater[],
  jetzt: Date
) {
  const relevante = ohneBuchungLetzte12Monate(vorgaenge, jetzt);
  if (relevante.length === 0) return null;

  const sortiert = relevante
    .slice()
    .sort((a, b) => a.erstelltAm.getTime() - b.erstelltAm.getTime());
  const erste = sortiert[0];
  const letzte = sortiert[sortiert.length - 1];

  // "ohne Buchung" bezieht sich nur auf die letzten 12 Monate (siehe
  // ohneBuchungLetzte12Monate). Ein Kunde kann trotzdem schon einmal
  // (länger zurückliegend oder über einen anderen Vorgang) gebucht haben –
  // das muss der Hinweistext unterscheiden, sonst behauptet er fälschlich,
  // der Kunde habe noch nie gebucht.
  const hatJemalsGebucht = vorgaenge.some((v) => v.status === "GEBUCHT");

  return {
    anzahlBisher: relevante.length,
    seitMonatJahr: erste.erstelltAm.toLocaleDateString("de-DE", {
      timeZone: BERLIN_TZ,
      month: "long",
      year: "numeric",
    }),
    letzterBerater: letzte.berater.name,
    letztesDatum: letzte.erstelltAm.toLocaleDateString("de-DE", {
      timeZone: BERLIN_TZ,
      day: "2-digit",
      month: "2-digit",
    }),
    hatJemalsGebucht,
  };
}
