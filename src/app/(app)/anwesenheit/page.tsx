import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import { heutigesDatumString, wochentage } from "@/lib/teampool";
import { formatBerlinUhrzeit } from "@/lib/zeit";
import LogoutNachtragenForm from "@/components/LogoutNachtragenForm";

const ORT_LABEL: Record<string, string> = {
  BUERO: "Büro",
  HOMEOFFICE: "Homeoffice",
};

function formatiereDatum(datumString: string): string {
  const [jahr, monat, tag] = datumString.split("-");
  return `${tag}.${monat}.${jahr}`;
}

function tagLabel(datumString: string): string {
  const [jahr, monat, tag] = datumString.split("-").map(Number);
  const datum = new Date(jahr, monat - 1, tag);
  const wochentag = datum.toLocaleDateString("de-DE", { weekday: "long" });
  return `${wochentag}, ${formatiereDatum(datumString)}`;
}

export default async function AnwesenheitPage({
  searchParams,
}: {
  searchParams: Promise<{ woche?: string }>;
}) {
  const mitarbeiter = await getAktuellerMitarbeiter();
  if (!mitarbeiter) redirect("/login");
  if (!mitarbeiter.istAdmin) redirect("/");

  const { woche } = await searchParams;
  const referenz = woche ? new Date(`${woche}T00:00:00`) : new Date();
  const tage = wochentage(referenz);
  const heute = heutigesDatumString(new Date());

  const vorherigeWoche = new Date(referenz);
  vorherigeWoche.setDate(referenz.getDate() - 7);
  const naechsteWoche = new Date(referenz);
  naechsteWoche.setDate(referenz.getDate() + 7);

  const eintraege = await prisma.anwesenheit.findMany({
    where: { datum: { in: tage }, ort: "HOMEOFFICE" },
    include: { mitarbeiter: true },
    orderBy: [{ datum: "asc" }, { mitarbeiter: { name: "asc" } }],
  });

  const nachTag = new Map<string, typeof eintraege>();
  for (const eintrag of eintraege) {
    const liste = nachTag.get(eintrag.datum) ?? [];
    liste.push(eintrag);
    nachTag.set(eintrag.datum, liste);
  }

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Anwesenheit</h1>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          Login-/Logout-Zeiten aus dem Homeoffice. Nur für Admins sichtbar,
          dient ausschließlich der Arbeitszeiterfassung, nicht der
          Leistungskontrolle. Büro-Tage werden nicht zeiterfasst.
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link
          href={`/anwesenheit?woche=${heutigesDatumString(vorherigeWoche)}`}
          className="link"
        >
          ← Vorherige Woche
        </Link>
        <span className="font-semibold">
          {formatiereDatum(tage[0])} – {formatiereDatum(tage[6])}
        </span>
        <Link
          href={`/anwesenheit?woche=${heutigesDatumString(naechsteWoche)}`}
          className="link"
        >
          Nächste Woche →
        </Link>
      </div>

      <a
        href={`/anwesenheit/export?woche=${tage[0]}`}
        className="btn-secondary text-sm text-center"
      >
        Woche als CSV herunterladen
      </a>

      {tage.map((tag) => {
        const tagesEintraege = nachTag.get(tag) ?? [];
        const istVergangen = tag < heute;
        return (
          <div key={tag} className="card p-4 flex flex-col gap-2">
            <h2 className="text-sm font-semibold">{tagLabel(tag)}</h2>
            {tagesEintraege.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">
                Niemand eingetragen.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tagesEintraege.map((eintrag) => {
                  const keinLogout = istVergangen && !eintrag.logoutZeit;
                  return (
                    <li
                      key={eintrag.id}
                      className="flex flex-col gap-0.5 border-b border-[var(--color-border)] last:border-0 pb-2 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">
                          {eintrag.mitarbeiter.name}
                        </span>
                        <span className="text-[var(--color-muted)]">
                          {eintrag.ort ? ORT_LABEL[eintrag.ort] : "–"}
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          keinLogout
                            ? "text-orange-600 font-medium"
                            : "text-[var(--color-muted)]"
                        }`}
                      >
                        {eintrag.loginZeit
                          ? `Login ${formatBerlinUhrzeit(eintrag.loginZeit)} Uhr`
                          : "kein Login erfasst"}
                        {" · "}
                        {eintrag.logoutZeit
                          ? `Logout ${formatBerlinUhrzeit(eintrag.logoutZeit)} Uhr`
                          : keinLogout
                          ? "kein Logout erfasst"
                          : "noch da"}
                      </p>
                      {keinLogout && (
                        <LogoutNachtragenForm anwesenheitId={eintrag.id} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </main>
  );
}
