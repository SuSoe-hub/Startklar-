import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function KundenPage() {
  const kunden = await prisma.kunde.findMany({
    orderBy: { createdAt: "desc" },
  });

  const sortiert = [...kunden].sort((a, b) => {
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

      {sortiert.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          Noch keine Kunden angelegt.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {sortiert.map((k) => {
          const unvollstaendig = !(k.handynummer && k.email);
          return (
            <li key={k.id}>
              <Link
                href={`/kunden/${k.id}`}
                className={`card block p-4 hover:shadow-md transition-shadow ${
                  unvollstaendig
                    ? "border-l-4 border-l-orange-500 bg-orange-50/50"
                    : ""
                }`}
              >
                <div className="font-semibold">
                  {k.vorname} {k.nachname}
                </div>
                <div className="text-sm text-[var(--color-muted)] mt-0.5">
                  {k.handynummer ?? "—"} · {k.email ?? "—"}
                </div>
                {unvollstaendig && (
                  <div className="text-xs text-orange-700 mt-1 font-semibold">
                    Kontaktdaten unvollständig
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
