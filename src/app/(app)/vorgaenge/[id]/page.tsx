import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import VorgangStatusForm from "@/components/VorgangStatusForm";
import WiedervorlageForm from "@/components/WiedervorlageForm";
import NotizForm from "@/components/NotizForm";

const KANAL_LABEL: Record<string, string> = {
  EMAIL: "E-Mail",
  WHATSAPP: "WhatsApp",
  TELEFON: "Telefon",
  VOR_ORT: "Vor Ort",
};

export default async function VorgangDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vorgang = await prisma.vorgang.findUnique({
    where: { id },
    include: {
      kunde: true,
      berater: true,
      notizen: {
        orderBy: { erstelltAm: "desc" },
        include: { mitarbeiter: true },
      },
    },
  });

  if (!vorgang) notFound();

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto flex flex-col gap-6">
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
        <VorgangStatusForm vorgangId={vorgang.id} status={vorgang.status} />
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
