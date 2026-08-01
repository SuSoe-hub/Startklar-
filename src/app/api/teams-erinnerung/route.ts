import { NextRequest, NextResponse } from "next/server";
import { zaehleFaelligeVorgaenge } from "@/lib/erinnerung";

export async function GET(request: NextRequest) {
  // Vercel Cron schickt CRON_SECRET automatisch als "Authorization: Bearer ..."
  // Header mit. Der ?secret=... Query-Parameter ist nur für manuelles Testen
  // im Browser gedacht.
  const authHeader = request.headers.get("authorization");
  const providedSecret =
    authHeader?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret");

  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "TEAMS_WEBHOOK_URL ist nicht gesetzt." },
      { status: 500 }
    );
  }

  const anzahl = await zaehleFaelligeVorgaenge(new Date());

  // Keine Erinnerung, wenn ohnehin nichts ansteht.
  if (anzahl === 0) {
    return NextResponse.json({ gesendet: false, anzahl });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const text =
    anzahl === 1
      ? "1 Kunde wartet heute auf euch in Startklar."
      : `${anzahl} Kunden warten heute auf euch in Startklar.`;

  const nachricht = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    summary: "Startklar Erinnerung",
    themeColor: "16645C",
    title: "Startklar",
    text,
    potentialAction: [
      {
        "@type": "OpenUri",
        name: "Jetzt öffnen",
        targets: [{ os: "default", uri: appUrl }],
      },
    ],
  };

  const antwort = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nachricht),
  });

  if (!antwort.ok) {
    const fehlertext = await antwort.text();
    return NextResponse.json(
      { error: "Teams-Webhook hat abgelehnt.", details: fehlertext },
      { status: 502 }
    );
  }

  return NextResponse.json({ gesendet: true, anzahl });
}
