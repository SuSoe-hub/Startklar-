export function begruessung(jetzt: Date) {
  const stunde = jetzt.getHours();
  if (stunde < 11) return "Guten Morgen";
  if (stunde < 18) return "Guten Tag";
  return "Guten Abend";
}
