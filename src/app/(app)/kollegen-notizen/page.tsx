import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import KollegenNotizForm from "@/components/KollegenNotizForm";
import KollegenNotizItem from "@/components/KollegenNotizItem";
import { getAktuellerMitarbeiter } from "@/lib/auth";

export default async function KollegenNotizenPage() {
  const aktuellerMitarbeiter = await getAktuellerMitarbeiter();
  if (!aktuellerMitarbeiter) redirect("/login");

  const [mitarbeiterListe, fuerMich, vonMir] = await Promise.all([
    prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
    prisma.kollegenNotiz.findMany({
      where: { fuerId: aktuellerMitarbeiter.id },
      orderBy: [{ erledigtAm: "asc" }, { erstelltAm: "desc" }],
      include: { von: true, fuer: true },
    }),
    prisma.kollegenNotiz.findMany({
      where: { vonId: aktuellerMitarbeiter.id },
      orderBy: [{ erledigtAm: "asc" }, { erstelltAm: "desc" }],
      include: { von: true, fuer: true },
    }),
  ]);

  const auswaehlbareMitarbeiter = mitarbeiterListe.filter(
    (m) => m.id !== aktuellerMitarbeiter.id
  );

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Kollegen-Notizen</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Für Buchungen, die schon abgeschlossen und nur noch in Argus zu
          finden sind, nicht mehr als Vorgang in Startklar.
        </p>
      </div>

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Neue Notiz</h2>
        <KollegenNotizForm mitarbeiter={auswaehlbareMitarbeiter} />
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Für dich</h2>
        {fuerMich.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Keine Notizen von Kolleg:innen.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {fuerMich.map((n) => (
              <KollegenNotizItem key={n.id} notiz={n} rolle="empfaenger" />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Von dir gesendet</h2>
        {vonMir.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Du hast noch keine Notiz für eine:n Kolleg:in hinterlassen.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vonMir.map((n) => (
              <KollegenNotizItem key={n.id} notiz={n} rolle="absender" />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
