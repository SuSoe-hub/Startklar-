import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VorgangForm from "@/components/VorgangForm";
import WiederholteAnfrageHinweis from "@/components/WiederholteAnfrageHinweis";
import { anfragenOhneBuchungLetzte12Monate, wiederholteAnfrageHinweisDaten } from "@/lib/kundenkarte";
import { getEinstellungen } from "@/lib/einstellungen";

export default async function NeuerVorgangPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [kunde, mitarbeiter, einstellungen] = await Promise.all([
    prisma.kunde.findUnique({
      where: { id },
      include: { vorgaenge: { include: { berater: true } } },
    }),
    prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
    getEinstellungen(),
  ]);

  if (!kunde) notFound();

  const jetzt = new Date();
  const anzahlOhneBuchung = anfragenOhneBuchungLetzte12Monate(
    kunde.vorgaenge,
    jetzt
  );
  const hinweisDaten =
    anzahlOhneBuchung >= einstellungen.schwelleWiederholteAnfragen
      ? wiederholteAnfrageHinweisDaten(kunde.vorgaenge, jetzt)
      : null;

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold tracking-tight mb-1">
        Neuer Vorgang
      </h1>
      <p className="text-sm text-[var(--color-muted)] mb-1">
        für {kunde.vorname} {kunde.nachname}
      </p>
      {hinweisDaten && <WiederholteAnfrageHinweis {...hinweisDaten} />}
      <div className="mt-4">
        <VorgangForm kundeId={kunde.id} mitarbeiter={mitarbeiter} />
      </div>
    </main>
  );
}
