-- CreateTable
CREATE TABLE "Mitarbeiter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Kunde" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "handynummer" TEXT,
    "email" TEXT,
    "typ" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vorgang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kundeId" TEXT NOT NULL,
    "beraterId" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kanal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ANGEBOT_RAUS',
    "wiedervorlage" DATETIME,
    "buchungsweg" TEXT,
    "verlustgrund" TEXT,
    "archiviert" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Vorgang_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vorgang_beraterId_fkey" FOREIGN KEY ("beraterId") REFERENCES "Mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vorgangId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notiz_vorgangId_fkey" FOREIGN KEY ("vorgangId") REFERENCES "Vorgang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Mitarbeiter_name_key" ON "Mitarbeiter"("name");

-- CreateIndex
CREATE INDEX "Kunde_handynummer_idx" ON "Kunde"("handynummer");

-- CreateIndex
CREATE INDEX "Kunde_email_idx" ON "Kunde"("email");

-- CreateIndex
CREATE INDEX "Vorgang_kundeId_idx" ON "Vorgang"("kundeId");

-- CreateIndex
CREATE INDEX "Vorgang_beraterId_idx" ON "Vorgang"("beraterId");

-- CreateIndex
CREATE INDEX "Vorgang_status_idx" ON "Vorgang"("status");

-- CreateIndex
CREATE INDEX "Vorgang_wiedervorlage_idx" ON "Vorgang"("wiedervorlage");

-- CreateIndex
CREATE INDEX "Notiz_vorgangId_idx" ON "Notiz"("vorgangId");
