import { berlinStunde } from "./zeit";

export function begruessung(jetzt: Date) {
  const stunde = berlinStunde(jetzt);
  if (stunde < 11) return "Guten Morgen";
  if (stunde < 18) return "Guten Tag";
  return "Guten Abend";
}

// Nur morgens ein Kaffee-Smiley zur Begrüßung, siehe begruessung().
export function begruessungsSmiley(jetzt: Date) {
  return berlinStunde(jetzt) < 11 ? "☕" : null;
}
