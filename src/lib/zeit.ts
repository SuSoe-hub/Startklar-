export const BERLIN_TZ = "Europe/Berlin";

// Ein <input type="datetime-local"> liefert eine Zeichenkette ohne
// Zeitzoneninfo (z. B. "2026-08-04T07:16"). Diese ist immer als Wanduhrzeit
// in Europe/Berlin gemeint (unsere Mitarbeiter sitzen alle dort). new
// Date(raw) würde das je nach Server-Laufzeitzone (auf Vercel: UTC) falsch
// interpretieren und die Uhrzeit verschieben. Diese Funktion rechnet die
// Berliner Wanduhrzeit korrekt (inkl. Sommer-/Winterzeit) in den passenden
// UTC-Zeitpunkt um.
export function parseBerlinDatetimeLocal(value: string): Date {
  const [datumsTeil, zeitTeil] = value.split("T");
  const [jahr, monat, tag] = datumsTeil.split("-").map(Number);
  const [stunde, minute] = (zeitTeil ?? "00:00").split(":").map(Number);

  const utcSchaetzung = Date.UTC(jahr, monat - 1, tag, stunde, minute);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BERLIN_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const teile = formatter.formatToParts(new Date(utcSchaetzung)).reduce(
    (acc, p) => {
      acc[p.type] = p.value;
      return acc;
    },
    {} as Record<string, string>
  );

  const alsBerlinInterpretiert = Date.UTC(
    Number(teile.year),
    Number(teile.month) - 1,
    Number(teile.day),
    Number(teile.hour),
    Number(teile.minute),
    Number(teile.second)
  );

  const offset = alsBerlinInterpretiert - utcSchaetzung;
  return new Date(utcSchaetzung - offset);
}

// Gegenstück zu parseBerlinDatetimeLocal: formatiert einen Zeitpunkt als
// Wert für <input type="datetime-local">, in Europe/Berlin-Wanduhrzeit -
// unabhängig davon, in welcher Zeitzone der Server gerade läuft.
export function formatBerlinDatetimeLocal(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BERLIN_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const teile = formatter.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {} as Record<string, string>);
  return `${teile.year}-${teile.month}-${teile.day}T${teile.hour}:${teile.minute}`;
}

// Formatiert einen Zeitpunkt als reine Uhrzeit (HH:MM) in Europe/Berlin -
// für Anzeigezwecke, z. B. Login-/Logout-Zeiten.
export function formatBerlinUhrzeit(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: BERLIN_TZ,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Liefert die Stunde (0-23) eines Zeitpunkts in Europe/Berlin-Wanduhrzeit -
// unabhängig davon, in welcher Zeitzone der Server läuft (auf Vercel: UTC).
// date.getHours() würde stattdessen die Server-Zeitzone verwenden.
export function berlinStunde(date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BERLIN_TZ,
    hourCycle: "h23",
    hour: "2-digit",
  });
  return Number(formatter.format(date));
}

// Nimmt den Kalendertag von `datum` (in Berlin) und setzt ihn auf die
// angegebene Berliner Uhrzeit - z. B. für "heute + 3 Werktage, 18:00 Uhr".
export function berlinDatumMitUhrzeit(
  datum: Date,
  stunde: number,
  minute: number
): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  const tag = formatBerlinDatetimeLocal(datum).slice(0, 10);
  return parseBerlinDatetimeLocal(`${tag}T${pad(stunde)}:${pad(minute)}`);
}
