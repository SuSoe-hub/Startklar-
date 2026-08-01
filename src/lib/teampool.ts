export function heutigesDatumString(jetzt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jetzt.getFullYear()}-${pad(jetzt.getMonth() + 1)}-${pad(
    jetzt.getDate()
  )}`;
}

const AUSFALLSICHERUNG_STUNDE = 11;

export function rollCallLaeuftNoch(jetzt: Date, anzahlAnwesend: number) {
  return anzahlAnwesend === 0 && jetzt.getHours() < AUSFALLSICHERUNG_STUNDE;
}

// Solange niemand angetippt hat (oder die Ausfallsicherung nach 11 Uhr greift),
// gilt niemand als abwesend – dann ist die Anwesenheitsliste für den Tag "leer"
// und die Abwesenheits-Umverteilung bleibt inaktiv.
export function abwesenheitAktiv(anzahlAnwesend: number) {
  return anzahlAnwesend > 0;
}
