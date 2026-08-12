-- AlterTable
ALTER TABLE "Mitarbeiter" ADD COLUMN     "benachrichtigungenGelesenAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Vorgang" ADD COLUMN     "erstelltVonId" TEXT;

-- CreateIndex
CREATE INDEX "Vorgang_erstelltVonId_idx" ON "Vorgang"("erstelltVonId");

-- AddForeignKey
ALTER TABLE "Vorgang" ADD CONSTRAINT "Vorgang_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "Mitarbeiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
