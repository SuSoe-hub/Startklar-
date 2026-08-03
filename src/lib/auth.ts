import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

export const SESSION_COOKIE = "startklar_session";
const SESSION_DAUER_TAGE = 90;
const INAKTIVITAET_MINUTEN = 30;

export async function hashePin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(pin, salt, 64);
  return { hash: derived.toString("hex"), salt };
}

export async function pruefePin(pin: string, hash: string, salt: string) {
  const derived = await scryptAsync(pin, salt, 64);
  const gespeichert = Buffer.from(hash, "hex");
  if (derived.length !== gespeichert.length) return false;
  return timingSafeEqual(derived, gespeichert);
}

export async function erstelleSession(mitarbeiterId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_DAUER_TAGE * 24 * 60 * 60 * 1000
  );

  await prisma.session.create({ data: { token, mitarbeiterId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function beendeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAktuellerMitarbeiter() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { mitarbeiter: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  const inaktivSeit = Date.now() - session.letzteAktivitaet.getTime();
  if (inaktivSeit > INAKTIVITAET_MINUTEN * 60 * 1000) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { letzteAktivitaet: new Date() },
  });

  return session.mitarbeiter;
}
