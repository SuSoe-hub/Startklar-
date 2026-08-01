-- CreateTable
CREATE TABLE "Anwesenheit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datum" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    CONSTRAINT "Anwesenheit_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Anwesenheit_datum_mitarbeiterId_key" ON "Anwesenheit"("datum", "mitarbeiterId");
