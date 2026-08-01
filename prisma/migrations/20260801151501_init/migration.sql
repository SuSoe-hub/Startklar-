-- CreateEnum
CREATE TYPE "KundeTyp" AS ENUM ('NEUKUNDE', 'STAMMKUNDE');

-- CreateEnum
CREATE TYPE "VorgangStatus" AS ENUM ('ANGEBOT_RAUS', 'NACHFASSEN', 'GEBUCHT', 'VERLOREN');

-- CreateEnum
CREATE TYPE "Kanal" AS ENUM ('EMAIL', 'WHATSAPP', 'TELEFON', 'VOR_ORT');

-- CreateEnum
CREATE TYPE "Buchungsweg" AS ENUM ('PERSOENLICH', 'SCHRIFTLICH');

-- CreateTable
CREATE TABLE "Mitarbeiter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinHash" TEXT,
    "pinSalt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mitarbeiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anwesenheit" (
    "id" TEXT NOT NULL,
    "datum" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,

    CONSTRAINT "Anwesenheit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kunde" (
    "id" TEXT NOT NULL,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "handynummer" TEXT,
    "email" TEXT,
    "typ" "KundeTyp" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kunde_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vorgang" (
    "id" TEXT NOT NULL,
    "kundeId" TEXT NOT NULL,
    "beraterId" TEXT NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kanal" "Kanal" NOT NULL,
    "status" "VorgangStatus" NOT NULL DEFAULT 'ANGEBOT_RAUS',
    "wiedervorlage" TIMESTAMP(3),
    "buchungsweg" "Buchungsweg",
    "verlustgrund" TEXT,
    "archiviert" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Vorgang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Einstellungen" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "schwelleWiederholteAnfragen" INTEGER NOT NULL DEFAULT 3,
    "smileysAktiviert" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Einstellungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notiz" (
    "id" TEXT NOT NULL,
    "vorgangId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mitarbeiterId" TEXT,

    CONSTRAINT "Notiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mitarbeiter_name_key" ON "Mitarbeiter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_mitarbeiterId_idx" ON "Session"("mitarbeiterId");

-- CreateIndex
CREATE UNIQUE INDEX "Anwesenheit_datum_mitarbeiterId_key" ON "Anwesenheit"("datum", "mitarbeiterId");

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

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anwesenheit" ADD CONSTRAINT "Anwesenheit_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vorgang" ADD CONSTRAINT "Vorgang_kundeId_fkey" FOREIGN KEY ("kundeId") REFERENCES "Kunde"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vorgang" ADD CONSTRAINT "Vorgang_beraterId_fkey" FOREIGN KEY ("beraterId") REFERENCES "Mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notiz" ADD CONSTRAINT "Notiz_vorgangId_fkey" FOREIGN KEY ("vorgangId") REFERENCES "Vorgang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notiz" ADD CONSTRAINT "Notiz_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
