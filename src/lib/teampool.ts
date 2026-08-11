// Merkt sich per Cookie, dass jemand die "Bist du heute da?"-Pflichtfrage
// beim Login schon mit "Nein" beantwortet hat - sonst würde die Sperre bei
// jeder Navigation erneut aufpoppen, obwohl schon geantwortet wurde.
export const ANWESENHEIT_GEFRAGT_COOKIE = "startklar_anwesenheit_gefragt";

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
