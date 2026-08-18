import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import { wochentage } from "@/lib/teampool";
import { formatBerlinUhrzeit } from "@/lib/zeit";

const ORT_LABEL: Record<string, string> = {
  BUERO: "Büro",
  HOMEOFFICE: "Homeoffice",
};

// Für die Lohnabteilung: Semikolon als Trenner (deutsches Excel-Standard-
// Listentrennzeichen) und ein UTF-8-BOM, damit Umlaute in Excel korrekt
// erscheinen statt als Sonderzeichen.
function zuCsvZeile(felder: string[]): string {
  return felder.map((f) => `"${f.replace(/"/g, '""')}"`).join(";");
}

export async function GET(request: NextRequest) {
  const mitarbeiter = await getAktuellerMitarbeiter();
  if (!mitarbeiter) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!mitarbeiter.istAdmin) {
    return NextResponse.json(
      { error: "Nur Admins dürfen Anwesenheitsdaten exportieren." },
      { status: 403 }
    );
  }

  const wocheParam = request.nextUrl.searchParams.get("woche");
  const referenz = wocheParam ? new Date(`${wocheParam}T00:00:00`) : new Date();
  const tage = wochentage(referenz);

  const eintraege = await prisma.anwesenheit.findMany({
    where: { datum: { in: tage }, ort: "HOMEOFFICE" },
    include: { mitarbeiter: true },
    orderBy: [{ datum: "asc" }, { mitarbeiter: { name: "asc" } }],
  });

  const zeilen = [
    zuCsvZeile(["Datum", "Mitarbeiter", "Ort", "Login", "Logout"]),
    ...eintraege.map((e) =>
      zuCsvZeile([
        e.datum,
        e.mitarbeiter.name,
        e.ort ? ORT_LABEL[e.ort] : "",
        e.loginZeit ? formatBerlinUhrzeit(e.loginZeit) : "",
        e.logoutZeit ? formatBerlinUhrzeit(e.logoutZeit) : "",
      ])
    ),
  ];

  const csv = "﻿" + zeilen.join("\r\n");
  const dateiname = `startklar-anwesenheit-${tage[0]}-bis-${tage[6]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
    },
  });
}
