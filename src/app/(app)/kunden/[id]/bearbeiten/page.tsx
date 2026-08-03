import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import KundeBearbeitenForm from "@/components/KundeBearbeitenForm";

export default async function KundeBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kunde = await prisma.kunde.findUnique({ where: { id } });
  if (!kunde) notFound();

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto">
      <Link href={`/kunden/${kunde.id}`} className="text-sm link">
        ← {kunde.vorname} {kunde.nachname}
      </Link>
      <h1 className="text-xl font-bold tracking-tight mt-1 mb-6">
        Kunde bearbeiten
      </h1>
      <KundeBearbeitenForm kunde={kunde} />
    </main>
  );
}
