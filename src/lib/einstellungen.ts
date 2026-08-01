import { prisma } from "@/lib/prisma";

export async function getEinstellungen() {
  return prisma.einstellungen.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}
