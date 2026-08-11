import Link from "next/link";
import { prisma } from "@/lib/prisma";
import KundenListe from "@/components/KundenListe";
import { kundenBadge, kundeIstErledigt } from "@/lib/kundenstatus";

export default async function KundenPage() {
  const [kunden, alleMitarbeiter] = await Promise.all([
    prisma.kunde.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vorgaenge: {
          select: {
            status: true,
            kanal: true,
            beraterId: true,
            wiedervorlage: true,
            optionsfrist: true,
            optionsArt: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
  ]);

  const jetzt = new Date();

  const angereichert = kunden.map(({ vorgaenge, ...k }) => ({
    ...k,
    istErledigt: kundeIstErledigt(vorgaenge),
    badge: kundenBadge(vorgaenge, jetzt),
    vorgaenge: vorgaenge.map((v) => ({
      status: v.status,
      kanal: v.kanal,
      beraterId: v.beraterId,
    })),
  }));

  const sortiert = [...angereichert].sort((a, b) => {
    const aUnvollstaendig = !(a.handynummer && a.email) ? 1 : 0;
    const bUnvollstaendig = !(b.handynummer && b.email) ? 1 : 0;
    return bUnvollstaendig - aUnvollstaendig;
  });

  return (
    <main className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold tracking-tight">Kunden</h1>
        <Link href="/kunden/neu" className="btn-primary">
          + Neuer Kunde
        </Link>
      </div>

      <KundenListe kunden={sortiert} alleMitarbeiter={alleMitarbeiter} />
    </main>
  );
}
