import { timingSafeEqual } from "crypto";

// Schützt die ganze Seite mit einem einzigen, geteilten Passwort (zusätzlich
// zur normalen Mitarbeiter-PIN), damit die App nicht einfach von jedem im
// Internet gefunden/aufgerufen werden kann. Vercel selbst bietet echten
// Passwortschutz erst ab dem Pro-Plan als teures Add-on, deshalb bauen wir
// das hier selbst als Middleware-Cookie-Gate.

export const SITE_GATE_COOKIE = "startklar_site_gate";
const GATE_MESSAGE = "startklar-site-gate-v1";
const ENCODER = new TextEncoder();

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    ENCODER.encode(message)
  );
  return Buffer.from(signature).toString("hex");
}

/** Der Wert, den ein gültiges Gate-Cookie enthalten muss. */
export async function erwartetesGateToken() {
  const passwort = process.env.SITE_PASSWORD;
  if (!passwort) return null;
  return hmacHex(passwort, GATE_MESSAGE);
}

/** Prüft ein im Browser eingegebenes Passwort gegen SITE_PASSWORD. */
export function pruefeSitePasswort(eingabe: string) {
  const passwort = process.env.SITE_PASSWORD;
  if (!passwort) return false;

  const a = Buffer.from(eingabe);
  const b = Buffer.from(passwort);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
