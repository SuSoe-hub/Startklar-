// Einfaches, selbstgebautes Backup, weil der Prisma Free-Plan keine
// automatischen Backups anbietet (siehe console.prisma.io -> Backups).
// Exportiert alle Geschäftsdaten als eine JSON-Datei nach OneDrive, damit sie
// automatisch in die Cloud gesichert wird - unabhängig von diesem Rechner.
// Session wird bewusst nicht mit exportiert (nur aktive Login-Tokens, keine
// Geschäftsdaten, würden beim Zurückspielen ohnehin nicht mehr gültig sein).
//
// Ausführen mit: npm run backup

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/prisma";

const ZIELORDNER = join(
  "C:",
  "Users",
  "Susam",
  "OneDrive",
  "Desktop",
  "APP Startklar",
  "Backups"
);

async function main() {
  const [mitarbeiter, kunden, vorgaenge, notizen, anwesenheiten, veranstalter, einstellungen] =
    await Promise.all([
      prisma.mitarbeiter.findMany(),
      prisma.kunde.findMany(),
      prisma.vorgang.findMany(),
      prisma.notiz.findMany(),
      prisma.anwesenheit.findMany(),
      prisma.veranstalter.findMany(),
      prisma.einstellungen.findMany(),
    ]);

  const backup = {
    erstelltAm: new Date().toISOString(),
    mitarbeiter,
    kunden,
    vorgaenge,
    notizen,
    anwesenheiten,
    veranstalter,
    einstellungen,
  };

  mkdirSync(ZIELORDNER, { recursive: true });
  const dateiname = `startklar-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  const pfad = join(ZIELORDNER, dateiname);

  writeFileSync(pfad, JSON.stringify(backup, null, 2), "utf-8");
  console.log(`Backup gespeichert: ${pfad}`);
  console.log(
    `${kunden.length} Kunden, ${vorgaenge.length} Vorgänge, ${notizen.length} Notizen, ${mitarbeiter.length} Mitarbeiter`
  );
}

main().finally(() => prisma.$disconnect());
