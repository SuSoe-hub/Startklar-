import { ampelFarbe, ampelSortWert } from "@/lib/ampel";

const OFFENE_STATI = new Set(["ANGEBOT_RAUS", "NACHFASSEN", "OPTION"]);

type VorgangFuerStatus = {
  status: string;
  wiedervorlage: Date | null;
  optionsfrist: Date | null;
  optionsArt: string | null;
  updatedAt: Date;
};

const OPTIONSART_BADGE_LABEL: Record<string, string> = {
  KUNDENOPTION: "Kundenoption",
  INTERN: "intern",
};

// Ein Kunde gilt nur dann als erledigt, wenn ALLE Vorgänge auf Gebucht oder
// Verloren stehen. Ein Kunde ohne jeden Vorgang ist noch nicht "erledigt" -
// er wartet ja noch auf seinen ersten Vorgang, nicht auf ein Ergebnis.
export function kundeIstErledigt(vorgaenge: VorgangFuerStatus[]) {
  if (vorgaenge.length === 0) return false;
  return vorgaenge.every((v) => !OFFENE_STATI.has(v.status));
}

export type KundenBadgeFarbe = "rot" | "gelb" | "gruen" | "gebucht" | "verloren";

export type KundenBadge = { label: string; farbe: KundenBadgeFarbe } | null;

// Für aktive Kunden: die dringendste Ampelfarbe unter den offenen Vorgängen
// (gleiche Logik/Priorität wie auf der Startseite, siehe ampel.ts). Für
// erledigte Kunden: Status des zuletzt aktualisierten Vorgangs. Kunden ohne
// Vorgang bekommen kein Badge.
export function kundenBadge(
  vorgaenge: VorgangFuerStatus[],
  jetzt: Date
): KundenBadge {
  if (vorgaenge.length === 0) return null;

  const offene = vorgaenge.filter((v) => OFFENE_STATI.has(v.status));

  // Eine offene Option hat eine echte Frist und kann im Zweifel Geld kosten -
  // sie soll deshalb immer rot auffallen, unabhängig davon wie weit ihre
  // Frist noch entfernt ist (gleiche Regel wie in ampel.ts/StartseiteFilter).
  const offeneOption = offene.find((v) => v.status === "OPTION");
  if (offeneOption) {
    return {
      label: OPTIONSART_BADGE_LABEL[offeneOption.optionsArt ?? ""] ?? "Option",
      farbe: "rot",
    };
  }

  if (offene.length === 0) {
    const letzter = [...vorgaenge].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )[0];
    return letzter.status === "GEBUCHT"
      ? { label: "Gebucht", farbe: "gebucht" }
      : { label: "Verloren", farbe: "verloren" };
  }

  const dringendste = offene
    .map((v) =>
      ampelFarbe({
        kontaktUnvollstaendig: false,
        wiedervorlage: v.wiedervorlage,
        optionsfrist: v.optionsfrist,
        jetzt,
      })
    )
    .sort((a, b) => ampelSortWert(a) - ampelSortWert(b))[0];

  if (dringendste === "rot") return { label: "Überfällig", farbe: "rot" };
  if (dringendste === "gelb") return { label: "Heute fällig", farbe: "gelb" };
  return { label: "Läuft", farbe: "gruen" };
}
