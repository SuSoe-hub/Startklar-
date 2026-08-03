-- AlterTable
ALTER TABLE "Mitarbeiter" ADD COLUMN     "fehlversuche" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gesperrtBis" TIMESTAMP(3);
