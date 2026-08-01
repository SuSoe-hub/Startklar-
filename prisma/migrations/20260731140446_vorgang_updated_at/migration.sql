/*
  Warnings:

  - Added the required column `updatedAt` to the `Vorgang` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vorgang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kundeId" TEXT NOT NULL,
    "beraterId" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kanal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ANGEBOT_RAUS',
    "wiedervorlage" DATETIME,
    "buchungsweg" TEXT,
    "verlustgrund" TEXT,
    "archiviert" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Vorgang_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vorgang_beraterId_fkey" FOREIGN KEY ("beraterId") REFERENCES "Mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vorgang" ("archiviert", "beraterId", "buchungsweg", "erstelltAm", "id", "kanal", "kundeId", "status", "verlustgrund", "wiedervorlage") SELECT "archiviert", "beraterId", "buchungsweg", "erstelltAm", "id", "kanal", "kundeId", "status", "verlustgrund", "wiedervorlage" FROM "Vorgang";
DROP TABLE "Vorgang";
ALTER TABLE "new_Vorgang" RENAME TO "Vorgang";
CREATE INDEX "Vorgang_kundeId_idx" ON "Vorgang"("kundeId");
CREATE INDEX "Vorgang_beraterId_idx" ON "Vorgang"("beraterId");
CREATE INDEX "Vorgang_status_idx" ON "Vorgang"("status");
CREATE INDEX "Vorgang_wiedervorlage_idx" ON "Vorgang"("wiedervorlage");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
