export type AmpelFarbe = "rot" | "gelb" | "orange" | "gruen" | "keine";

function tagesgrenzen(jetzt: Date) {
  const heuteStart = new Date(
    jetzt.getFullYear(),
    jetzt.getMonth(),
    jetzt.getDate()
  );
  const heuteEnde = new Date(
    jetzt.getFullYear(),
    jetzt.getMonth(),
    jetzt.getDate() + 1
  );
  const morgenEnde = new Date(
    jetzt.getFullYear(),
    jetzt.getMonth(),
    jetzt.getDate() + 2
  );
  return { heuteStart, heuteEnde, morgenEnde };
}

// Optionen sind strenger als eine normale Wiedervorlage: Weil ein Versäumnis
// hier Geld kostet, gilt schon der Fälligkeitstag selbst als rot (nicht erst
// überfällig), und die Vorwarnung "läuft morgen ab" kommt einen Tag früher
// als bei der Wiedervorlage-Logik.
function faelligkeitsFarbe(
  termin: Date,
  jetzt: Date,
  optionsRegel: boolean
): AmpelFarbe {
  const { heuteStart, heuteEnde, morgenEnde } = tagesgrenzen(jetzt);

  if (termin < heuteStart) return "rot";
  if (optionsRegel) {
    if (termin < heuteEnde) return "rot";
    if (termin < morgenEnde) return "gelb";
    return "gruen";
  }
  if (termin < heuteEnde) return "gelb";
  return "gruen";
}

export function ampelFarbe({
  kontaktUnvollstaendig,
  wiedervorlage,
  optionsfrist = null,
  jetzt,
}: {
  kontaktUnvollstaendig: boolean;
  wiedervorlage: Date | null;
  optionsfrist?: Date | null;
  jetzt: Date;
}): AmpelFarbe {
  if (kontaktUnvollstaendig) return "orange";

  const kandidaten: { termin: Date; optionsRegel: boolean }[] = [];
  if (wiedervorlage) kandidaten.push({ termin: wiedervorlage, optionsRegel: false });
  if (optionsfrist) kandidaten.push({ termin: optionsfrist, optionsRegel: true });
  if (kandidaten.length === 0) return "keine";

  // Der frühere der beiden Termine bestimmt die Farbe (siehe
  // Startklar_Erweiterung_Optionen.md, Abschnitt 2 "Optionsfrist ist ein
  // eigenes Feld").
  kandidaten.sort((a, b) => a.termin.getTime() - b.termin.getTime());
  const { termin, optionsRegel } = kandidaten[0];
  return faelligkeitsFarbe(termin, jetzt, optionsRegel);
}

// Priorität für die Sortierung der Übersicht: am Dringendsten zuerst.
const SORT_PRIORITAET: Record<AmpelFarbe, number> = {
  rot: 0,
  gelb: 1,
  orange: 2,
  keine: 3,
  gruen: 4,
};

export function ampelSortWert(farbe: AmpelFarbe) {
  return SORT_PRIORITAET[farbe];
}

export function istFaellig(farbe: AmpelFarbe) {
  return farbe === "rot" || farbe === "gelb";
}

const TAGE_BIS_ARCHIVIERUNG = 60;

export function istArchiviertDurchInaktivitaet(
  letzteAktivitaet: Date,
  jetzt: Date
) {
  const grenze = new Date(letzteAktivitaet);
  grenze.setDate(grenze.getDate() + TAGE_BIS_ARCHIVIERUNG);
  return jetzt > grenze;
}

// Eine Option mit verstrichener Frist, die noch nicht aktiv beendet wurde
// (Gebucht/Verlängert/Aufgelöst), darf nie automatisch archiviert werden –
// sie muss dauerhaft rot und oben sichtbar bleiben, siehe Erweiterung
// Optionsverwaltung, Abschnitt 4.
export function istUnerledigteUeberfaelligeOption(
  status: string,
  optionsfrist: Date | null,
  jetzt: Date
) {
  return status === "OPTION" && !!optionsfrist && optionsfrist < jetzt;
}
