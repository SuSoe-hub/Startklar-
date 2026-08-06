import { NextRequest, NextResponse } from "next/server";
import { SITE_GATE_COOKIE, erwartetesGateToken } from "@/lib/site-gate";

// Diese Routen bleiben absichtlich ohne Passwort erreichbar:
// - /site-login: die Passwort-Seite selbst (sonst Endlos-Redirect)
// - /impressum, /datenschutz: müssen laut Gesetz (TMG) ohne Zugangshürde
//   für jeden erreichbar sein
// - /api: der Teams-Erinnerung-Cron-Endpunkt hat sein eigenes CRON_SECRET
//   und wird von Vercel selbst aufgerufen, nicht über den Browser
const OEFFENTLICHE_PFADE = ["/site-login", "/impressum", "/datenschutz"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (OEFFENTLICHE_PFADE.some((pfad) => pathname.startsWith(pfad))) {
    return NextResponse.next();
  }

  const erwartet = await erwartetesGateToken();

  // Kein SITE_PASSWORD gesetzt (z. B. lokale Entwicklung) -> Gate übersprungen.
  if (!erwartet) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SITE_GATE_COOKIE)?.value;
  if (cookie === erwartet) {
    return NextResponse.next();
  }

  const zielUrl = new URL("/site-login", request.url);
  zielUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(zielUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.svg$|api/).*)",
  ],
};
