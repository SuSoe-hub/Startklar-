-- CreateEnum
CREATE TYPE "OptionsArt" AS ENUM ('KUNDENOPTION', 'INTERN');

-- AlterEnum
ALTER TYPE "VorgangStatus" ADD VALUE 'OPTION';

-- AlterTable
ALTER TABLE "Vorgang" ADD COLUMN     "optionNotiz" TEXT,
ADD COLUMN     "optionVeranstalterId" TEXT,
ADD COLUMN     "optionVeranstalterSonstige" TEXT,
ADD COLUMN     "optionVorgangsnummer" TEXT,
ADD COLUMN     "optionsArt" "OptionsArt",
ADD COLUMN     "optionsfrist" TIMESTAMP(3),
ADD COLUMN     "vorherigerStatus" "VorgangStatus";

-- CreateTable
CREATE TABLE "Veranstalter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Veranstalter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Veranstalter_code_key" ON "Veranstalter"("code");

-- CreateIndex
CREATE INDEX "Vorgang_optionsfrist_idx" ON "Vorgang"("optionsfrist");

-- AddForeignKey
ALTER TABLE "Vorgang" ADD CONSTRAINT "Vorgang_optionVeranstalterId_fkey" FOREIGN KEY ("optionVeranstalterId") REFERENCES "Veranstalter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
