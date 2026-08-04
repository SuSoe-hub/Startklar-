export function heutigesDatumString(jetzt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jetzt.getFullYear()}-${pad(jetzt.getMonth() + 1)}-${pad(
    jetzt.getDate()
  )}`;
}

// Solange niemand angetippt hat, gilt niemand als abwesend – dann ist die
// Anwesenheitsliste für den Tag "leer"
// und die Abwesenheits-Umverteilung bleibt inaktiv.
export function abwesenheitAktiv(anzahlAnwesend: number) {
  return anzahlAnwesend > 0;
}
