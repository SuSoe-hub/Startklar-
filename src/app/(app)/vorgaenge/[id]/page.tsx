import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import VorgangStatusForm from "@/components/VorgangStatusForm";
import OptionAufloesenPanel from "@/components/OptionAufloesenPanel";
import WiedervorlageForm from "@/components/WiedervorlageForm";
import NotizForm from "@/components/NotizForm";
import AnerkennungFlash from "@/components/AnerkennungFlash";
import { heutePlusWerktage } from "@/lib/werktage";

const KANAL_LABEL: Record<string, string> = {
  EMAIL: "E-Mail",
  WHATSAPP: "WhatsApp",
  TELEFON: "Telefon",
  VOR_ORT: "Vor Ort",
};

const OPTIONSART_LABEL: Record<string, string> = {
  KUNDENOPTION: "Kundenoption",
  INTERN: "Interne Option",
};

function datumZuDatetimeLocal(datum: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${datum.getFullYear()}-${pad(datum.getMonth() + 1)}-${pad(
    datum.getDate()
  )}T${pad(datum.getHours())}:${pad(datum.getMinutes())}`;
}

export default async function VorgangDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ anerkennung?: string }>;
}) {
  const { id } = await params;
  const { anerkennung } = await searchParams;
  const [vorgang, veranstalterListe] = await Promise.all([
    prisma.vorgang.findUnique({
      where: { id },
      include: {
        kunde: true,
        berater: true,
        optionVeranstalter: true,
        notizen: {
          orderBy: { erstelltAm: "desc" },
          include: { mitarbeiter: true },
        },
      },
    }),
    prisma.veranstalter.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (!vorgang) notFound();

  const vorschlagFrist = new Date(heutePlusWerktage(new Date(), 3));
  vorschlagFrist.setHours(18, 0, 0, 0);

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto flex flex-col gap-6">
      {anerkennung && <AnerkennungFlash text={anerkennung} />}
      <div>
        <Link href={`/kunden/${vorgang.kunde.id}`} className="text-sm link">
          ← {vorgang.kunde.vorname} {vorgang.kunde.nachname}
        </Link>
        <h1 className="text-xl font-bold tracking-tight mt-1">Vorgang</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {KANAL_LABEL[vorgang.kanal]} · Berater: {vorgang.berater.name} ·
          angelegt am {vorgang.erstelltAm.toLocaleDateString("de-DE")}
        </p>
      </div>

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Status</h2>

        {vorgang.status === "OPTION" && (
          <div className="mb-3 pb-3 border-b border-[var(--color-border)] text-sm flex flex-col gap-1">
            <span className="font-semibold">
              {OPTIONSART_LABEL[vorgang.optionsArt ?? ""]}
            </span>
            {vorgang.optionsArt === "INTERN" && (
              <p className="text-amber-700 font-semibold text-xs">
                Kunde weiß nichts von dieser Reservierung.
              </p>
            )}
            <p className="text-[var(--color-muted)]">
              {vorgang.optionVeranstalter?.code ??
                vorgang.optionVeranstalterSonstige}{" "}
              · Vorgang {vorgang.optionVorgangsnummer} · Frist{" "}
              {vorgang.optionsfrist?.toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {vorgang.optionNotiz && <p>{vorgang.optionNotiz}</p>}
          </div>
        )}

        {vorgang.status === "OPTION" ? (
          <OptionAufloesenPanel
            vorgangId={vorgang.id}
            optionsArt={vorgang.optionsArt ?? "KUNDENOPTION"}
            optionsfrist={
              vorgang.optionsfrist
                ? datumZuDatetimeLocal(vorgang.optionsfrist)
                : datumZuDatetimeLocal(vorschlagFrist)
            }
          />
        ) : (
          <VorgangStatusForm
            vorgangId={vorgang.id}
            status={vorgang.status}
            buchungsweg={vorgang.buchungsweg}
            verlustgrund={vorgang.verlustgrund}
            veranstalter={veranstalterListe}
            vorschlagOptionsfrist={datumZuDatetimeLocal(vorschlagFrist)}
          />
        )}

        {vorgang.status === "GEBUCHT" && vorgang.buchungsweg && (
          <p className="text-sm text-[var(--color-muted)] mt-2">
            Buchungsweg:{" "}
            {vorgang.buchungsweg === "PERSOENLICH"
              ? "Persönlich"
              : "Schriftlich"}
          </p>
        )}
        {vorgang.status === "VERLOREN" && vorgang.verlustgrund && (
          <p className="text-sm text-[var(--color-muted)] mt-2">
            Verlustgrund: {vorgang.verlustgrund}
          </p>
        )}
      </section>

      {vorgang.status !== "GEBUCHT" && vorgang.status !== "VERLOREN" && (
        <section className="card p-4">
          <h2 className="font-semibold mb-2">Wiedervorlage</h2>
          <WiedervorlageForm
            vorgangId={vorgang.id}
            wiedervorlage={vorgang.wiedervorlage?.toISOString() ?? null}
          />
        </section>
      )}

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Notizen</h2>
        <NotizForm vorgangId={vorgang.id} />
        <ul className="flex flex-col gap-2 mt-3">
          {vorgang.notizen.map((n) => (
            <li
              key={n.id}
              className="text-sm border-l-2 pl-2 border-[var(--color-border)]"
            >
              <div className="text-xs text-[var(--color-muted)]">
                {n.mitarbeiter ? `${n.mitarbeiter.name} · ` : ""}
                {n.erstelltAm.toLocaleString("de-DE")}
              </div>
              <div>{n.text}</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
