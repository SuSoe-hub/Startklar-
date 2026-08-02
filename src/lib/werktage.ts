import Holidays from "date-holidays";

// Bayern (DE, BY) – Feiertage inkl. der bayernspezifischen (Fronleichnam,
// Mariä Himmelfahrt teilweise, Allerheiligen).
const feiertage = new Holidays("DE", "BY");

function istWerktag(datum: Date) {
  const wochentag = datum.getDay();
  if (wochentag === 0 || wochentag === 6) return false;
  return !feiertage.isHoliday(datum);
}

// Schlägt "heute + n Werktage" vor (Samstag/Sonntag/bayerische Feiertage
// zählen nicht mit). Wird beim Anlegen einer Option als Vorschlag für die
// Optionsfrist verwendet – überschreibbar, siehe Konzept-Erweiterung.
export function heutePlusWerktage(heute: Date, anzahlWerktage: number): Date {
  const ergebnis = new Date(
    heute.getFullYear(),
    heute.getMonth(),
    heute.getDate()
  );
  let verbleibend = anzahlWerktage;
  while (verbleibend > 0) {
    ergebnis.setDate(ergebnis.getDate() + 1);
    if (istWerktag(ergebnis)) verbleibend--;
  }
  return ergebnis;
}
