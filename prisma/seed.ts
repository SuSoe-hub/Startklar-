import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const namen = ["Malo", "Hannah", "Alysha", "Fernando", "Mohsen", "Susanna", "Sait"];

const veranstalterCodes = [
  "TUID", "DER", "SLR", "COR", "ANEX", "ALL", "BYE", "LMX",
  "VTO", "FER", "ITS", "BCH", "OGE", "NEC", "BU",
];

async function main() {
  for (const name of namen) {
    await prisma.mitarbeiter.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const code of veranstalterCodes) {
    await prisma.veranstalter.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
