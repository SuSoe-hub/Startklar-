"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashePin, pruefePin, erstelleSession, beendeSession } from "@/lib/auth";

export type LoginFormState = { error: string | null };

const PIN_REGEX = /^\d{4}$/;

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

  if (!mitarbeiter.pinHash || !mitarbeiter.pinSalt) {
    const { hash, salt } = await hashePin(pin);
    await prisma.mitarbeiter.update({
      where: { id: mitarbeiterId },
      data: { pinHash: hash, pinSalt: salt },
    });
    await erstelleSession(mitarbeiterId);
    redirect("/");
  }

  const gueltig = await pruefePin(pin, mitarbeiter.pinHash, mitarbeiter.pinSalt);
  if (!gueltig) {
    return { error: "Falsche PIN." };
  }

  await erstelleSession(mitarbeiterId);
  redirect("/");
}

export async function logout() {
  await beendeSession();
  redirect("/login");
}
