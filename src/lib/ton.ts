export function begruessung(jetzt: Date) {
  const stunde = jetzt.getHours();
  if (stunde < 11) return "Guten Morgen";
  if (stunde < 18) return "Guten Tag";
  return "Guten Abend";
}

// Nur morgens ein Kaffee-Smiley zur Begrüßung, siehe begruessung().
export function begruessungsSmiley(jetzt: Date) {
  return jetzt.getHours() < 11 ? "☕" : null;
}
