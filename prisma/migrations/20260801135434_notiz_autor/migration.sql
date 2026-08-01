-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vorgangId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mitarbeiterId" TEXT,
    CONSTRAINT "Notiz_vorgangId_fkey" FOREIGN KEY ("vorgangId") REFERENCES "Vorgang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notiz_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Notiz" ("erstelltAm", "id", "text", "vorgangId") SELECT "erstelltAm", "id", "text", "vorgangId" FROM "Notiz";
DROP TABLE "Notiz";
ALTER TABLE "new_Notiz" RENAME TO "Notiz";
CREATE INDEX "Notiz_vorgangId_idx" ON "Notiz"("vorgangId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
