export function enthaeltUmlaut(text: string) {
  return /[äöüÄÖÜß]/.test(text);
}
