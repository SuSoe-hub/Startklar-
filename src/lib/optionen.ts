// Vier Erinnerungsstufen für Optionen, siehe Startklar_Erweiterung_Optionen.md,
// Abschnitt 5. Feiner als die normale Ampel (rot/gelb/orange/grün/keine),
// weil "heute" noch mal in "morgens" und "ab 15 Uhr" unterteilt wird.
export type OptionsStufe =
  | "verstrichen"
  | "heute_ab_15"
  | "heute"
  | "morgen"
  | "spaeter";

const NACHMITTAG_STUNDE = 15;

function istGleicherTag(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function optionsStufe(optionsfrist: Date, jetzt: Date): OptionsStufe {
  if (optionsfrist < jetzt) return "verstrichen";

  if (istGleicherTag(optionsfrist, jetzt)) {
    return jetzt.getHours() >= NACHMITTAG_STUNDE ? "heute_ab_15" : "heute";
  }

  const morgen = new Date(jetzt);
  morgen.setDate(morgen.getDate() + 1);
  if (istGleicherTag(optionsfrist, morgen)) return "morgen";

  return "spaeter";
}

// Für den Warnbereich im Tagesstart: fällig heute oder überfällig.
export function istOptionImTagesstartBereich(stufe: OptionsStufe) {
  return stufe === "verstrichen" || stufe === "heute" || stufe === "heute_ab_15";
}

export function stundenBisFrist(optionsfrist: Date, jetzt: Date) {
  const diffMs = optionsfrist.getTime() - jetzt.getTime();
  return Math.max(0, Math.ceil(diffMs / (60 * 60 * 1000)));
}

export const OPTIONSSTUFE_LABEL: Record<OptionsStufe, string> = {
  verstrichen: "Frist verstrichen",
  heute_ab_15: "Läuft heute ab",
  heute: "Heute fällig",
  morgen: "Läuft morgen ab",
  spaeter: "Läuft",
};
