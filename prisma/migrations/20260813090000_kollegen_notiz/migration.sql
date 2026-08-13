-- CreateTable
CREATE TABLE "KollegenNotiz" (
    "id" TEXT NOT NULL,
    "kundenname" TEXT NOT NULL,
    "argusNummer" TEXT,
    "text" TEXT NOT NULL,
    "vonId" TEXT NOT NULL,
    "fuerId" TEXT NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bearbeitetAm" TIMESTAMP(3),
    "erledigtAm" TIMESTAMP(3),

    CONSTRAINT "KollegenNotiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KollegenNotiz_vonId_idx" ON "KollegenNotiz"("vonId");

-- CreateIndex
CREATE INDEX "KollegenNotiz_fuerId_idx" ON "KollegenNotiz"("fuerId");

-- AddForeignKey
ALTER TABLE "KollegenNotiz" ADD CONSTRAINT "KollegenNotiz_vonId_fkey" FOREIGN KEY ("vonId") REFERENCES "Mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KollegenNotiz" ADD CONSTRAINT "KollegenNotiz_fuerId_fkey" FOREIGN KEY ("fuerId") REFERENCES "Mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
