export type AmpelFarbe = "rot" | "gelb" | "orange" | "gruen" | "keine";

export function ampelFarbe({
  kontaktUnvollstaendig,
  wiedervorlage,
  jetzt,
}: {
  kontaktUnvollstaendig: boolean;
  wiedervorlage: Date | null;
  jetzt: Date;
}): AmpelFarbe {
  if (kontaktUnvollstaendig) return "orange";
  if (!wiedervorlage) return "keine";

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

  if (wiedervorlage < heuteStart) return "rot";
  if (wiedervorlage < heuteEnde) return "gelb";
  return "gruen";
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
