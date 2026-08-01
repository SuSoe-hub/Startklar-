import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ampelFarbe,
  ampelSortWert,
  istArchiviertDurchInaktivitaet,
  istFaellig,
  type AmpelFarbe,
} from "@/lib/ampel";
import {
  abwesenheitAktiv,
  heutigesDatumString,
  rollCallLaeuftNoch,
} from "@/lib/teampool";
import WerIstHeuteDa from "@/components/WerIstHeuteDa";
import UebernahmeForm from "@/components/UebernahmeForm";
import { begruessung } from "@/lib/ton";
import { getEinstellungen } from "@/lib/einstellungen";

const KANAL_LABEL: Record<string, string> = {
  EMAIL: "E-Mail",
  WHATSAPP: "WhatsApp",
  TELEFON: "Telefon",
  VOR_ORT: "Vor Ort",
};

const FARBE_STYLE: Record<AmpelFarbe, string> = {
  rot: "border-l-4 border-l-red-500 bg-red-50/50",
  gelb: "border-l-4 border-l-amber-500 bg-amber-50/50",
  orange: "border-l-4 border-l-orange-500 bg-orange-50/50",
  gruen: "border-l-4 border-l-green-500 bg-green-50/50",
  keine: "border-l-4 border-l-gray-300",
};

const FARBE_BADGE: Record<AmpelFarbe, string> = {
  rot: "text-red-700 bg-red-100",
  gelb: "text-amber-700 bg-amber-100",
  orange: "text-orange-700 bg-orange-100",
  gruen: "text-green-700 bg-green-100",
  keine: "text-gray-500 bg-gray-100",
};

const FARBE_LABEL: Record<AmpelFarbe, string> = {
  rot: "Überfällig",
  gelb: "Heute fällig",
  orange: "Kontaktdaten unvollständig",
  gruen: "Läuft",
  keine: "Keine Wiedervorlage",
};

export default async function UebersichtPage() {
  const jetzt = new Date();
  const heute = heutigesDatumString(jetzt);

  const heuteStart = new Date(
    jetzt.getFullYear(),
    jetzt.getMonth(),
    jetzt.getDate()
  );

  const [vorgaenge, alleMitarbeiter, anwesenheitenHeute, einstellungen, kuerzlichGebucht] =
    await Promise.all([
      prisma.vorgang.findMany({
        where: { status: { in: ["ANGEBOT_RAUS", "NACHFASSEN"] } },
        include: {
          kunde: true,
          berater: true,
          notizen: { orderBy: { erstelltAm: "desc" }, take: 1 },
        },
      }),
      prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
      prisma.anwesenheit.findMany({ where: { datum: heute } }),
      getEinstellungen(),
      prisma.vorgang.findMany({
        where: { status: "GEBUCHT", updatedAt: { gte: heuteStart } },
        include: { kunde: true, berater: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  const anwesendeIds = new Set(anwesenheitenHeute.map((a) => a.mitarbeiterId));
  const zeigeRollCall = rollCallLaeuftNoch(jetzt, anwesendeIds.size);
  const umverteilungAktiv = abwesenheitAktiv(anwesendeIds.size);
  const anwesendeMitarbeiter = alleMitarbeiter.filter((m) =>
    anwesendeIds.has(m.id)
  );

  const eintraege = vorgaenge
    .map((v) => {
      const letzteAktivitaet = new Date(
        Math.max(
          v.erstelltAm.getTime(),
          v.updatedAt.getTime(),
          v.notizen[0]?.erstelltAm.getTime() ?? 0
        )
      );
      const kontaktUnvollstaendig = !(v.kunde.handynummer && v.kunde.email);
      const farbe = ampelFarbe({
        kontaktUnvollstaendig,
        wiedervorlage: v.wiedervorlage,
        jetzt,
      });
      return { v, farbe, letzteAktivitaet };
    })
    .filter(
      ({ letzteAktivitaet }) =>
        !istArchiviertDurchInaktivitaet(letzteAktivitaet, jetzt)
    )
    .sort((a, b) => {
      const prio = ampelSortWert(a.farbe) - ampelSortWert(b.farbe);
      if (prio !== 0) return prio;
      const aZeit = a.v.wiedervorlage?.getTime() ?? 0;
      const bZeit = b.v.wiedervorlage?.getTime() ?? 0;
      return aZeit - bZeit;
    });

  const poolEintraege = umverteilungAktiv
    ? eintraege.filter(
        ({ v, farbe }) => !anwesendeIds.has(v.beraterId) && istFaellig(farbe)
      )
    : [];
  const poolIds = new Set(poolEintraege.map(({ v }) => v.id));
  const normaleEintraege = eintraege.filter(({ v }) => !poolIds.has(v.id));

  const heuteOderUeberfaellig = eintraege.filter(({ farbe }) =>
    istFaellig(farbe)
  ).length;

  return (
    <main className="p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Startklar</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {begruessung(jetzt)}
          {heuteOderUeberfaellig === 0
            ? " – heute ist nichts fällig."
            : ` – ${heuteOderUeberfaellig} Kunde${
                heuteOderUeberfaellig === 1 ? "" : "n"
              } warten heute auf dich.`}
        </p>
      </div>

      {kuerzlichGebucht.length > 0 && (
        <div className="card border-l-4 border-l-green-500 bg-green-50/50 p-4 text-sm flex flex-col gap-1">
          {kuerzlichGebucht.map((v) => (
            <div key={v.id}>
              {einstellungen.smileysAktiviert && "🎉 "}
              {v.berater.name} hat für {v.kunde.vorname} {v.kunde.nachname}{" "}
              gebucht!
            </div>
          ))}
        </div>
      )}

      {zeigeRollCall && <WerIstHeuteDa mitarbeiter={alleMitarbeiter} />}

      {poolEintraege.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-muted)] mb-2">
            Heute unbetreut – {poolEintraege.length} Kunde
            {poolEintraege.length === 1 ? "" : "n"} warten
          </h2>
          <ul className="flex flex-col gap-2 mb-2">
            {poolEintraege.map(({ v, farbe }) => (
              <li key={v.id} className={`card p-4 ${FARBE_STYLE[farbe]}`}>
                <Link href={`/vorgaenge/${v.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {v.kunde.vorname} {v.kunde.nachname}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FARBE_BADGE[farbe]}`}
                    >
                      {FARBE_LABEL[farbe]}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--color-muted)] mt-0.5">
                    {KANAL_LABEL[v.kanal]} · eigentlich {v.berater.name}
                  </div>
                </Link>
                <UebernahmeForm
                  vorgangId={v.id}
                  anwesende={anwesendeMitarbeiter}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {normaleEintraege.length === 0 && poolEintraege.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          Keine offenen Vorgänge. Alles erledigt oder noch nichts angelegt.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {normaleEintraege.map(({ v, farbe }) => (
          <li key={v.id}>
            <Link
              href={`/vorgaenge/${v.id}`}
              className={`card block p-4 hover:shadow-md transition-shadow ${FARBE_STYLE[farbe]}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {v.kunde.vorname} {v.kunde.nachname}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FARBE_BADGE[farbe]}`}
                >
                  {FARBE_LABEL[farbe]}
                </span>
              </div>
              <div className="text-sm text-[var(--color-muted)] mt-0.5">
                {KANAL_LABEL[v.kanal]} · {v.berater.name}
                {v.wiedervorlage &&
                  ` · Wiedervorlage: ${v.wiedervorlage.toLocaleString(
                    "de-DE",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}`}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
