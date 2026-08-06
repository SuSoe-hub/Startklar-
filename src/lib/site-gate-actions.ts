"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SITE_GATE_COOKIE,
  erwartetesGateToken,
  pruefeSitePasswort,
} from "@/lib/site-gate";

export type SiteGateFormState = { error: string | null };

export async function siteLogin(
  ziel: string,
  _prevState: SiteGateFormState,
  formData: FormData
): Promise<SiteGateFormState> {
  const passwort = String(formData.get("passwort") ?? "");

  if (!process.env.SITE_PASSWORD) {
    return {
      error:
        "SITE_PASSWORD ist auf dem Server nicht gesetzt. Bitte in den Vercel-Projekteinstellungen eintragen.",
    };
  }

  if (!pruefeSitePasswort(passwort)) {
    return { error: "Falsches Passwort." };
  }

  const token = await erwartetesGateToken();
  const cookieStore = await cookies();
  cookieStore.set(SITE_GATE_COOKIE, token!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 Tage
  });

  redirect(ziel.startsWith("/") ? ziel : "/");
}
