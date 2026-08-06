import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ampelFarbe,
  ampelSortWert,
  istArchiviertDurchInaktivitaet,
  istFaellig,
  istUnerledigteUeberfaelligeOption,
  type AmpelFarbe,
} from "@/lib/ampel";
import {
  optionsStufe,
  istOptionImTagesstartBereich,
  stundenBisFrist,
  type OptionsStufe,
} from "@/lib/optionen";
import { abwesenheitAktiv, heutigesDatumString } from "@/lib/teampool";
import WerIstHeuteDa from "@/components/WerIstHeuteDa";
import UebernahmeForm from "@/components/UebernahmeForm";
import { begruessung, begruessungsSmiley } from "@/lib/ton";
import { getEinstellungen } from "@/lib/einstellungen";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import { BERLIN_TZ } from "@/lib/zeit";

const OPTIONSART_BADGE_LABEL: Record<string, string> = {
  KUNDENOPTION: "Kundenoption",
  INTERN: "intern",
};

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

  const [
    vorgaenge,
    alleMitarbeiter,
    anwesenheitenHeute,
    einstellungen,
    kuerzlichGebucht,
    aktuellerMitarbeiter,
  ] = await Promise.all([
    prisma.vorgang.findMany({
      where: { status: { in: ["ANGEBOT_RAUS", "NACHFASSEN", "OPTION"] } },
      include: {
        kunde: true,
        berater: true,
        optionVeranstalter: true,
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
    getAktuellerMitarbeiter(),
  ]);

  const anwesendeIds = new Set(anwesenheitenHeute.map((a) => a.mitarbeiterId));
  const umverteilungAktiv = abwesenheitAktiv(anwesendeIds.size);
  const anwesendeMitarbeiter = alleMitarbeiter.filter((m) =>
    anwesendeIds.has(m.id)
  );
  // Jede Person markiert sich einzeln als anwesend - unabhängig davon, ob
  // Kolleg:innen das schon getan haben (vorher verschwand die ganze Abfrage
  // für alle, sobald irgendjemand geklickt hatte).
  const bereitsAnwesend = aktuellerMitarbeiter
    ? anwesendeIds.has(aktuellerMitarbeiter.id)
    : false;

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
        optionsfrist: v.optionsfrist,
        jetzt,
      });
      const stufe: OptionsStufe | null =
        v.status === "OPTION" && v.optionsfrist
          ? optionsStufe(v.optionsfrist, jetzt)
          : null;
      return { v, farbe, letzteAktivitaet, stufe };
    })
    .filter(({ v, letzteAktivitaet }) => {
      if (istUnerledigteUeberfaelligeOption(v.status, v.optionsfrist, jetzt)) {
        return true;
      }
      return !istArchiviertDurchInaktivitaet(letzteAktivitaet, jetzt);
    })
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

  // Optionen heute fällig oder überfällig: eigener, besonders auffälliger
  // Bereich ganz oben (siehe Startklar_Erweiterung_Optionen.md, Abschnitt 5).
  // Überfällige stehen über den heute fälligen.
  const optionenFaelligEintraege = eintraege
    .filter(({ v, stufe }) => v.status === "OPTION" && stufe && istOptionImTagesstartBereich(stufe))
    .sort((a, b) => {
      const rang = (s: OptionsStufe | null) => (s === "verstrichen" ? 0 : 1);
      const rangDiff = rang(a.stufe) - rang(b.stufe);
      if (rangDiff !== 0) return rangDiff;
      return (a.v.optionsfrist?.getTime() ?? 0) - (b.v.optionsfrist?.getTime() ?? 0);
    });
  const optionenFaelligIds = new Set(optionenFaelligEintraege.map(({ v }) => v.id));

  // Vorwarnung: Option läuft morgen ab (verpflichtend, siehe Abschnitt 5 –
  // Optionen verfallen oft schon mittags, eine Warnung erst am Fälligkeitstag
  // reicht nicht).
  const optionenMorgenEintraege = eintraege.filter(
    ({ v, stufe }) => v.status === "OPTION" && stufe === "morgen"
  );
  const optionenMorgenIds = new Set(optionenMorgenEintraege.map(({ v }) => v.id));

  const normaleEintraege = eintraege.filter(
    ({ v }) =>
      !poolIds.has(v.id) &&
      !optionenFaelligIds.has(v.id) &&
      !optionenMorgenIds.has(v.id)
  );

  const heuteOderUeberfaellig = eintraege.filter(({ farbe }) =>
    istFaellig(farbe)
  ).length;

  return (
    <main className="p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Startklar</h1>
        <p className="text-base text-[var(--color-muted)] mt-1">
          {begruessung(jetzt)}
          {einstellungen.smileysAktiviert &&
            begruessungsSmiley(jetzt) &&
            ` ${begruessungsSmiley(jetzt)}`}
          {heuteOderUeberfaellig === 0
            ? " – heute ist nichts fällig."
            : heuteOderUeberfaellig === 1
              ? " – 1 Kunde wartet heute auf dich."
              : ` – ${heuteOderUeberfaellig} Kunden warten heute auf dich.`}
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

      {optionenFaelligEintraege.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-700 mb-2">
            Optionen heute fällig – {optionenFaelligEintraege.length}
          </h2>
          <ul className="flex flex-col gap-2 mb-2">
            {optionenFaelligEintraege.map(({ v, stufe }) => {
              const veranstalterName =
                v.optionVeranstalter?.code ?? v.optionVeranstalterSonstige ?? "";
              const fristZeit = v.optionsfrist?.toLocaleTimeString("de-DE", {
                timeZone: BERLIN_TZ,
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <li key={v.id} className="card p-4 border-l-4 border-l-red-500 bg-red-50/50">
                  <Link href={`/vorgaenge/${v.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {v.kunde.nachname}, {v.kunde.vorname}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-red-700 bg-red-100">
                        {OPTIONSART_BADGE_LABEL[v.optionsArt ?? ""]}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--color-muted)] mt-0.5">
                      {veranstalterName} · Vorgang {v.optionVorgangsnummer} ·{" "}
                      {stufe === "verstrichen"
                        ? "Frist verstrichen"
                        : `heute ${fristZeit}`}
                      {stufe === "heute_ab_15" &&
                        v.optionsfrist &&
                        ` · läuft in ${stundenBisFrist(v.optionsfrist, jetzt)} Std. ab`}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {optionenMorgenEintraege.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-700 mb-2">
            Optionen, die morgen ablaufen – {optionenMorgenEintraege.length}
          </h2>
          <ul className="flex flex-col gap-2 mb-2">
            {optionenMorgenEintraege.map(({ v }) => (
              <li key={v.id} className="card p-4 border-l-4 border-l-amber-500 bg-amber-50/50">
                <Link href={`/vorgaenge/${v.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {v.kunde.nachname}, {v.kunde.vorname}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-amber-700 bg-amber-100">
                      {OPTIONSART_BADGE_LABEL[v.optionsArt ?? ""]}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--color-muted)] mt-0.5">
                    {v.optionVeranstalter?.code ?? v.optionVeranstalterSonstige} ·
                    Vorgang {v.optionVorgangsnummer} · Option läuft morgen ab
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {aktuellerMitarbeiter && (
        <WerIstHeuteDa
          aktuellerMitarbeiter={aktuellerMitarbeiter}
          bereitsAnwesend={bereitsAnwesend}
        />
      )}

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
        {normaleEintraege.map(({ v, farbe }) => {
          // Eine Option ist immer termingebunden und kostet im Zweifel Geld –
          // deshalb fällt sie auch weit vor ihrer Frist schon durch Rot auf,
          // statt wie eine normale Wiedervorlage erst kurz vorher gelb/rot zu
          // werden.
          const istOption = v.status === "OPTION";
          const stilFarbe: AmpelFarbe = istOption ? "rot" : farbe;
          const badgeLabel = istOption
            ? OPTIONSART_BADGE_LABEL[v.optionsArt ?? ""]
            : FARBE_LABEL[farbe];

          return (
            <li key={v.id}>
              <Link
                href={`/vorgaenge/${v.id}`}
                className={`card block p-4 hover:shadow-md transition-shadow ${FARBE_STYLE[stilFarbe]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {v.kunde.vorname} {v.kunde.nachname}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${FARBE_BADGE[stilFarbe]}`}
                  >
                    {badgeLabel}
                  </span>
                </div>
                <div className="text-sm text-[var(--color-muted)] mt-0.5">
                  {KANAL_LABEL[v.kanal]} · {v.berater.name}
                  {istOption && v.optionsfrist
                    ? ` · Optionsfrist: ${v.optionsfrist.toLocaleString(
                        "de-DE",
                        {
                          timeZone: BERLIN_TZ,
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}`
                    : v.wiedervorlage &&
                      ` · Wiedervorlage: ${v.wiedervorlage.toLocaleString(
                        "de-DE",
                        {
                          timeZone: BERLIN_TZ,
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}`}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
