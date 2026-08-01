import { prisma } from "@/lib/prisma";

export async function findeMoeglicheDubletten({
  kundeId,
  handynummer,
  email,
}: {
  kundeId: string;
  handynummer: string | null;
  email: string | null;
}) {
  if (!handynummer && !email) return [];

  const or = [];
  if (handynummer) or.push({ handynummer });
  if (email) or.push({ email });

  return prisma.kunde.findMany({
    where: {
      id: { not: kundeId },
      OR: or,
    },
  });
}
