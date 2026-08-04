"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAktuellerMitarbeiter, hashePin } from "@/lib/auth";

const PIN_REGEX = /^\d{4}$/;

export type AdminPinFormState = { error: string | null; erfolg: string | null };

// Nur ein Admin darf für andere Mitarbeiter eine PIN setzen/zurücksetzen -
// verhindert, dass sich jemand einen fremden Namen "kapert" (siehe Bugfix
// PIN-Vergabe). Wird auch für vergessene PINs genutzt: setzt gleichzeitig
// Fehlversuche/Sperre zurück.
export async function adminSetzePin(
  mitarbeiterId: string,
  _prevState: AdminPinFormState,
  formData: FormData
): Promise<AdminPinFormState> {
  const admin = await getAktuellerMitarbeiter();
  if (!admin?.istAdmin) {
    return { error: "Nur Admins dürfen PINs vergeben.", erfolg: null };
  }

  const pin = ((formData.get("pin") as string) ?? "").trim();
  if (!PIN_REGEX.test(pin)) {
    return { error: "PIN muss aus 4 Ziffern bestehen.", erfolg: null };
  }

  const ziel = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
  });
  if (!ziel) {
    return { error: "Mitarbeiter nicht gefunden.", erfolg: null };
  }

  const { hash, salt } = await hashePin(pin);
  await prisma.mitarbeiter.update({
    where: { id: mitarbeiterId },
    data: {
      pinHash: hash,
      pinSalt: salt,
      fehlversuche: 0,
      gesperrtBis: null,
    },
  });

  revalidatePath("/einstellungen");
  return { error: null, erfolg: `PIN für ${ziel.name} gesetzt.` };
}
