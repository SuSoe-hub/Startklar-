import Link from "next/link";
import { prisma } from "@/lib/prisma";
import KundenListe from "@/components/KundenListe";
import { kundenBadge, kundeIstErledigt, OFFENE_STATI_LISTE } from "@/lib/kundenstatus";

const VORGANG_SELECT = {
  status: true,
  kanal: true,
  beraterId: true,
  wiedervorlage: true,
  optionsfrist: true,
  optionsArt: true,
  updatedAt: true,
} as const;

// Nur "aktive" Kunden werden hier standardmäßig geladen (mindestens ein
// Vorgang noch offen, oder noch gar keiner) - diese Menge bleibt über die
// Jahre ungefähr gleich groß, weil erledigte Vorgänge herausfallen, sobald
// sie abgeschlossen sind. Die komplette Kundenhistorie (Tab "Erledigt")
// wächst dagegen unbegrenzt und wird deshalb nicht mehr komplett auf jeden
// Seitenaufruf mitgeschickt, sondern nur noch bei Bedarf serverseitig
// durchsucht (siehe sucheErledigteKunden in actions.ts).
export default async function KundenPage() {
  const [kunden, alleMitarbeiter, erledigtAnzahl] = await Promise.all([
    prisma.kunde.findMany({
      where: {
        OR: [
          { vorgaenge: { none: {} } },
          { vorgaenge: { some: { status: { in: [...OFFENE_STATI_LISTE] } } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { vorgaenge: { select: VORGANG_SELECT } },
    }),
    prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
    prisma.kunde.count({
      where: {
        vorgaenge: { some: {} },
        NOT: { vorgaenge: { some: { status: { in: [...OFFENE_STATI_LISTE] } } } },
      },
    }),
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

      <KundenListe
        kunden={sortiert}
        erledigtAnzahl={erledigtAnzahl}
        alleMitarbeiter={alleMitarbeiter}
      />
    </main>
  );
}
