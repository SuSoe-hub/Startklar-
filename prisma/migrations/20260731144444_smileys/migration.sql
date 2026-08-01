-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Einstellungen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "schwelleWiederholteAnfragen" INTEGER NOT NULL DEFAULT 3,
    "smileysAktiviert" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Einstellungen" ("id", "schwelleWiederholteAnfragen") SELECT "id", "schwelleWiederholteAnfragen" FROM "Einstellungen";
DROP TABLE "Einstellungen";
ALTER TABLE "new_Einstellungen" RENAME TO "Einstellungen";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
