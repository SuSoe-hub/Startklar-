-- CreateEnum
CREATE TYPE "Ort" AS ENUM ('BUERO', 'HOMEOFFICE');

-- AlterTable
ALTER TABLE "Anwesenheit" ADD COLUMN     "loginZeit" TIMESTAMP(3),
ADD COLUMN     "logoutZeit" TIMESTAMP(3),
ADD COLUMN     "ort" "Ort";
