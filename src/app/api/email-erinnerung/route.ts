import { NextRequest, NextResponse } from "next/server";
import { sammleUeberfaelligeVorgaenge } from "@/lib/erinnerung";
import { sendeMail } from "@/lib/msgraph";

export async function GET(request: NextRequest) {
  // Vercel Cron schickt CRON_SECRET automatisch als "Authorization: Bearer ..."
  // Header mit. Der ?secret=... Query-Parameter ist nur für manuelles Testen
  // im Browser gedacht (siehe teams-erinnerung).
  const authHeader = request.headers.get("authorization");
  const providedSecret =
    authHeader?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret");

  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const von = process.env.ERINNERUNG_EMAIL_VON;
  const an = process.env.ERINNERUNG_EMAIL_AN;
  if (!von || !an) {
    return NextResponse.json(
      { error: "ERINNERUNG_EMAIL_VON/AN ist nicht gesetzt." },
      { status: 500 }
    );
  }

  const faelle = await sammleUeberfaelligeVorgaenge(new Date());

  if (faelle.length === 0) {
    return NextResponse.json({ gesendet: false, anzahl: 0 });
  }

  const optionen = faelle.filter((f) => f.istOption);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const zeilen = faelle.map(
    (f) =>
      `- ${f.kundeName} (${f.beraterName})${f.istOption ? " – OPTION, dringend!" : ""}`
  );

  const text = [
    `${faelle.length} überfällige${faelle.length === 1 ? "r" : ""} Fall${
      faelle.length === 1 ? "" : "e"
    } in Startklar.`,
    optionen.length > 0
      ? `Davon ${optionen.length} überfällige Option${
          optionen.length === 1 ? "" : "en"
        } – kann Geld kosten, bitte zuerst prüfen!`
      : null,
    "",
    ...zeilen,
    "",
    `Jetzt öffnen: ${appUrl}`,
  ]
    .filter((zeile) => zeile !== null)
    .join("\n");

  await sendeMail({
    von,
    an,
    betreff: `Startklar: ${faelle.length} überfällige${
      faelle.length === 1 ? "r" : ""
    } Fall${faelle.length === 1 ? "" : "e"}${
      optionen.length > 0 ? ` (${optionen.length} Option${optionen.length === 1 ? "" : "en"}!)` : ""
    }`,
    text,
  });

  return NextResponse.json({ gesendet: true, anzahl: faelle.length });
}
