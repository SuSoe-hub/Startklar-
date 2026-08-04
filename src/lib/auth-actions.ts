"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pruefePin, erstelleSession, beendeSession } from "@/lib/auth";

export type LoginFormState = { error: string | null };

const PIN_REGEX = /^\d{4}$/;
const MAX_FEHLVERSUCHE = 5;
const SPERRE_DAUER_MINUTEN = 15;

export async function login(
  mitarbeiterId: string,
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const pin = ((formData.get("pin") as string) ?? "").trim();
  if (!PIN_REGEX.test(pin)) {
    return { error: "PIN muss aus 4 Ziffern bestehen." };
  }

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
  });
  if (!mitarbeiter) {
    return { error: "Mitarbeiter nicht gefunden." };
  }

  if (mitarbeiter.gesperrtBis && mitarbeiter.gesperrtBis > new Date()) {
    const minuten = Math.ceil(
      (mitarbeiter.gesperrtBis.getTime() - Date.now()) / 60000
    );
    return {
      error: `Zu viele Fehlversuche. Bitte in ${minuten} Minute${
        minuten === 1 ? "" : "n"
      } erneut versuchen.`,
    };
  }

  // Erstvergabe der PIN passiert nicht mehr im Login selbst (siehe Bugfix:
  // sonst könnte jede beliebige Person einen unbenutzten Namen "kapern").
  // Ein Admin muss die PIN vorher unter Einstellungen vergeben haben.
  if (!mitarbeiter.pinHash || !mitarbeiter.pinSalt) {
    return {
      error:
        "Für dich ist noch keine PIN eingerichtet. Bitte eine:n Admin bitten, dir eine PIN zu vergeben.",
    };
  }

  const gueltig = await pruefePin(pin, mitarbeiter.pinHash, mitarbeiter.pinSalt);
  if (!gueltig) {
    const fehlversuche = mitarbeiter.fehlversuche + 1;
    const gesperrt = fehlversuche >= MAX_FEHLVERSUCHE;
    await prisma.mitarbeiter.update({
      where: { id: mitarbeiterId },
      data: {
        fehlversuche: gesperrt ? 0 : fehlversuche,
        gesperrtBis: gesperrt
          ? new Date(Date.now() + SPERRE_DAUER_MINUTEN * 60000)
          : null,
      },
    });
    return {
      error: gesperrt
        ? `Zu viele Fehlversuche. Bitte in ${SPERRE_DAUER_MINUTEN} Minuten erneut versuchen.`
        : "Falsche PIN.",
    };
  }

  await prisma.mitarbeiter.update({
    where: { id: mitarbeiterId },
    data: { fehlversuche: 0, gesperrtBis: null },
  });
  await erstelleSession(mitarbeiterId);
  redirect("/");
}

export async function logout() {
  await beendeSession();
  redirect("/login");
}
