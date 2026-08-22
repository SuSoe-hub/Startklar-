import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { kundenStatistik } from "@/lib/kundenkarte";
import { findeMoeglicheDubletten } from "@/lib/dubletten";
import MergeKundeButton from "@/components/MergeKundeButton";
import DeleteKundeButton from "@/components/DeleteKundeButton";
import CopyButton from "@/components/CopyButton";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import { BERLIN_TZ } from "@/lib/zeit";

const STATUS_LABEL: Record<string, string> = {
  ANGEBOT_RAUS: "Angebot raus",
  OPTION: "Option",
  NACHFASSEN: "Nachfassen",
  GEBUCHT: "Gebucht",
  VERLOREN: "Verloren",
  ERLEDIGT: "Erledigt",
};

export default async function KundeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kunde = await prisma.kunde.findUnique({
    where: { id },
    include: {
      vorgaenge: {
        orderBy: { erstelltAm: "desc" },
        include: { berater: true },
      },
    },
  });

  if (!kunde) notFound();

  const aktuellerMitarbeiter = await getAktuellerMitarbeiter();
  const unvollstaendig = !(kunde.handynummer && kunde.email);
  const statistik = kundenStatistik(kunde.vorgaenge, new Date());
  const dubletten = await findeMoeglicheDubletten({
    kundeId: kunde.id,
    handynummer: kunde.handynummer,
    email: kunde.email,
  });

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto">
      <Link href="/kunden" className="text-sm link">
        ← Kunden
      </Link>
      <div className="flex items-center justify-between mt-1 mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">
            {kunde.vorname} {kunde.nachname}
          </h1>
          <CopyButton value={`${kunde.vorname} ${kunde.nachname}`} label="Name" />
        </div>
        <Link href={`/kunden/${kunde.id}/bearbeiten`} className="text-sm link">
          Bearbeiten
        </Link>
      </div>
      {unvollstaendig && (
        <p className="text-sm text-orange-700 font-semibold mb-3">
          Kontaktdaten unvollständig
        </p>
      )}
      {dubletten.length > 0 && (
        <div className="card border-l-4 border-l-[var(--color-primary-400)] bg-[var(--color-primary-50)]/60 p-4 text-sm mb-4 flex flex-col gap-2">
          <div>
            Gleiche Handynummer oder E-Mail auch bei:{" "}
            {dubletten.map((d, i) => (
              <span key={d.id}>
                {i > 0 && ", "}
                <Link href={`/kunden/${d.id}`} className="link font-semibold">
                  {d.vorname} {d.nachname}
                </Link>
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {dubletten.map((d) => (
              <MergeKundeButton
                key={d.id}
                zielKundeId={kunde.id}
                quelleKundeId={d.id}
                quelleName={`${d.vorname} ${d.nachname}`}
              />
            ))}
          </div>
        </div>
      )}
      <dl className="text-sm flex flex-col gap-1 mb-6">
        <div>
          <dt className="inline text-[var(--color-muted)]">Typ: </dt>
          <dd className="inline">
            {kunde.typ === "NEUKUNDE" ? "Neukunde" : "Stammkunde"}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="inline text-[var(--color-muted)]">Handynummer: </dt>
          <dd className="inline">{kunde.handynummer ?? "—"}</dd>
          {kunde.handynummer && (
            <CopyButton value={kunde.handynummer} label="Handynummer" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <dt className="inline text-[var(--color-muted)]">E-Mail: </dt>
          <dd className="inline">{kunde.email ?? "—"}</dd>
          {kunde.email && <CopyButton value={kunde.email} label="E-Mail" />}
        </div>
      </dl>

      <div className="card p-4 mb-6 text-sm grid grid-cols-2 gap-y-1.5">
        <div className="text-[var(--color-muted)]">Vorgänge gesamt</div>
        <div>{statistik.gesamt}</div>
        <div className="text-[var(--color-muted)]">davon dieses Jahr</div>
        <div>{statistik.imLaufendenJahr}</div>
        <div className="text-[var(--color-muted)]">gebucht</div>
        <div>{statistik.gebucht}</div>
        <div className="text-[var(--color-muted)]">verloren</div>
        <div>{statistik.verloren}</div>
        <div className="text-[var(--color-muted)]">erledigt</div>
        <div>{statistik.erledigt}</div>
        <div className="text-[var(--color-muted)]">offen</div>
        <div>{statistik.offen}</div>
        <div className="text-[var(--color-muted)]">letzte Buchung</div>
        <div>
          {statistik.letzteBuchungAm
            ? statistik.letzteBuchungAm.toLocaleDateString("de-DE", {
                timeZone: BERLIN_TZ,
              })
            : "—"}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Vorgänge</h2>
        <Link href={`/kunden/${kunde.id}/vorgang/neu`} className="text-sm link">
          + Neuer Vorgang
        </Link>
      </div>

      {kunde.vorgaenge.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          Noch keine Vorgänge.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {kunde.vorgaenge.map((v) => (
          <li key={v.id}>
            <Link
              href={`/vorgaenge/${v.id}`}
              className="card block p-3 hover:shadow-md transition-shadow"
            >
              <div className="text-sm font-semibold">
                {STATUS_LABEL[v.status]}
              </div>
              <div className="text-xs text-[var(--color-muted)] mt-0.5">
                {v.berater.name} ·{" "}
                {v.erstelltAm.toLocaleDateString("de-DE", {
                  timeZone: BERLIN_TZ,
                })}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-2 items-start">
        {aktuellerMitarbeiter?.istAdmin && (
          <a
            href={`/kunden/${kunde.id}/export`}
            className="text-xs text-[var(--color-muted)] underline hover:text-[var(--color-primary-600)]"
          >
            Daten dieses Kunden exportieren (JSON)
          </a>
        )}
        {aktuellerMitarbeiter?.istAdmin && (
          <DeleteKundeButton
            kundeId={kunde.id}
            anzahlVorgaenge={kunde.vorgaenge.length}
          />
        )}
      </div>
    </main>
  );
}
