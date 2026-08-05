import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "crypto";

// Team-weite Zugriffssperre, die JEDER Anfrage vorgeschaltet ist – auch der
// Mitarbeiter-Namensliste unter /login. Das ist eine zusätzliche Sperre vor
// der eigentlichen Mitarbeiter-PIN-Anmeldung (src/lib/auth.ts) und ersetzt
// diese nicht.

const COOKIE_NAME = "sk_zugriff";
const COOKIE_MAX_AGE_SEKUNDEN = 60 * 60 * 24 * 30; // 30 Tage
const HMAC_SALT = "startklar-team-zugriff";

function erwartetesToken(passwort: string) {
  return createHmac("sha256", passwort).update(HMAC_SALT).digest("hex");
}

function tokenGueltig(token: string | undefined, passwort: string) {
  if (!token) return false;
  const erwartet = erwartetesToken(passwort);
  const a = Buffer.from(token);
  const b = Buffer.from(erwartet);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function passwoerterGleich(eingabe: string, passwort: string) {
  const a = createHash("sha256").update(eingabe).digest();
  const b = createHash("sha256").update(passwort).digest();
  return timingSafeEqual(a, b);
}

function sperrbildschirmHtml(fehler?: string) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Startklar – Zugriff gesperrt</title>
<meta name="robots" content="noindex, nofollow" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f172a;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    padding: 1.5rem;
  }
  .karte {
    width: 100%;
    max-width: 320px;
    background: #fff;
    border-radius: 12px;
    padding: 2rem 1.75rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  }
  h1 {
    font-size: 1.1rem;
    margin: 0 0 1.25rem;
    color: #0f172a;
    text-align: center;
  }
  input[type="password"] {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }
  button {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border: none;
    border-radius: 8px;
    background: #0f172a;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
  }
  .fehler {
    color: #b91c1c;
    font-size: 0.875rem;
    margin: -0.4rem 0 0.75rem;
  }
</style>
</head>
<body>
  <div class="karte">
    <h1>Startklar ist gesperrt</h1>
    <form method="post">
      ${fehler ? `<p class="fehler">${fehler}</p>` : ""}
      <input type="password" name="passwort" placeholder="Team-Passwort" autofocus required />
      <button type="submit">Entsperren</button>
    </form>
  </div>
</body>
</html>`;
}

function sperrbildschirmAntwort(fehler?: string) {
  return new Response(sperrbildschirmHtml(fehler), {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function proxy(request: NextRequest) {
  const teamPasswort = process.env.TEAM_ACCESS_PASSWORD;

  if (!teamPasswort) {
    return new Response(
      "Zugriffsschutz ist nicht konfiguriert: Umgebungsvariable TEAM_ACCESS_PASSWORD fehlt.",
      { status: 500 }
    );
  }

  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (tokenGueltig(cookieToken, teamPasswort)) {
    return NextResponse.next();
  }

  if (request.method === "POST") {
    let eingabe = "";
    try {
      const formData = await request.formData();
      eingabe = String(formData.get("passwort") ?? "");
    } catch {
      // Kein auswertbares Formular (z. B. ein anderer POST-Request) –
      // wird unten wie eine falsche Eingabe behandelt.
    }

    if (eingabe && passwoerterGleich(eingabe, teamPasswort)) {
      const antwort = NextResponse.redirect(request.nextUrl, { status: 303 });
      antwort.cookies.set(COOKIE_NAME, erwartetesToken(teamPasswort), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: COOKIE_MAX_AGE_SEKUNDEN,
      });
      return antwort;
    }

    return sperrbildschirmAntwort("Falsches Passwort.");
  }

  return sperrbildschirmAntwort();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/teams-erinnerung).*)",
  ],
};
