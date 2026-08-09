import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAktuellerMitarbeiter } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mitarbeiter = await getAktuellerMitarbeiter();
  if (!mitarbeiter) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!mitarbeiter.istAdmin) {
    return NextResponse.json(
      { error: "Nur Admins dürfen Kundendaten exportieren." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const kunde = await prisma.kunde.findUnique({
    where: { id },
    include: {
      vorgaenge: {
        orderBy: { erstelltAm: "desc" },
        include: {
          berater: { select: { name: true } },
          optionVeranstalter: { select: { code: true } },
          notizen: {
            orderBy: { erstelltAm: "desc" },
            include: { mitarbeiter: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!kunde) {
    return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  }

  const daten = {
    exportiertAm: new Date().toISOString(),
    kunde: {
      vorname: kunde.vorname,
      nachname: kunde.nachname,
      typ: kunde.typ,
      handynummer: kunde.handynummer,
      email: kunde.email,
      angelegtAm: kunde.createdAt,
    },
    vorgaenge: kunde.vorgaenge.map((v) => ({
      erstelltAm: v.erstelltAm,
      kanal: v.kanal,
      status: v.status,
      berater: v.berater.name,
      buchungsweg: v.buchungsweg,
      verlustgrund: v.verlustgrund,
      wiedervorlage: v.wiedervorlage,
      option: v.optionsArt
        ? {
            art: v.optionsArt,
            veranstalter: v.optionVeranstalter?.code ?? v.optionVeranstalterSonstige,
            vorgangsnummer: v.optionVorgangsnummer,
            frist: v.optionsfrist,
            notiz: v.optionNotiz,
          }
        : null,
      notizen: v.notizen.map((n) => ({
        text: n.text,
        erstelltAm: n.erstelltAm,
        mitarbeiter: n.mitarbeiter?.name ?? null,
      })),
    })),
  };

  const dateiname = `startklar-export-${kunde.nachname}-${kunde.vorname}.json`
    .replace(/\s+/g, "-")
    .toLowerCase();

  return new NextResponse(JSON.stringify(daten, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
    },
  });
}
