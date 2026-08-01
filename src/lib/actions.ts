"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { heutigesDatumString } from "@/lib/teampool";
import { getAktuellerMitarbeiter } from "@/lib/auth";

export type DuplicateHinweis = {
  kundeId: string;
  name: string;
  letzteBeratung: { datum: string; berater: string } | null;
} | null;

export async function checkDuplicateKunde(
  handynummer: string,
  email: string
): Promise<DuplicateHinweis> {
  const handy = handynummer.trim();
  const mail = email.trim();
  if (!handy && !mail) return null;

  const or = [];
  if (handy) or.push({ handynummer: handy });
  if (mail) or.push({ email: mail });

  const kunde = await prisma.kunde.findFirst({
    where: { OR: or },
    include: {
      vorgaenge: {
        orderBy: { erstelltAm: "desc" },
        take: 1,
        include: { berater: true },
      },
    },
  });

  if (!kunde) return null;

  const letzterVorgang = kunde.vorgaenge[0];

  return {
    kundeId: kunde.id,
    name: `${kunde.vorname} ${kunde.nachname}`,
    letzteBeratung: letzterVorgang
      ? {
          datum: letzterVorgang.erstelltAm.toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
          }),
          berater: letzterVorgang.berater.name,
        }
      : null,
  };
}

export type KundeFormState = { error: string | null };

export async function createKunde(
  _prevState: KundeFormState,
  formData: FormData
): Promise<KundeFormState> {
  const vorname = ((formData.get("vorname") as string) ?? "").trim();
  const nachname = ((formData.get("nachname") as string) ?? "").trim();
  const handynummer =
    ((formData.get("handynummer") as string) ?? "").trim() || null;
  const email = ((formData.get("email") as string) ?? "").trim() || null;
  const typ = formData.get("typ") as string;

  if (!vorname || !nachname) {
    return { error: "Vorname und Nachname sind Pflichtfelder." };
  }
  if (typ !== "NEUKUNDE" && typ !== "STAMMKUNDE") {
    return { error: "Bitte Kundentyp auswählen." };
  }
  // Speicherregel: Name plus mindestens ein Kontaktweg.
  if (!handynummer && !email) {
    return {
      error:
        "Mindestens ein Kontaktweg (Handynummer oder E-Mail) wird benötigt.",
    };
  }

  const kunde = await prisma.kunde.create({
    data: {
      vorname,
      nachname,
      handynummer,
      email,
      typ: typ as "NEUKUNDE" | "STAMMKUNDE",
    },
  });

  revalidatePath("/kunden");
  redirect(`/kunden/${kunde.id}`);
}

export type VorgangFormState = { error: string | null };

const KANAL_WERTE = ["EMAIL", "WHATSAPP", "TELEFON", "VOR_ORT"] as const;

export async function createVorgang(
  kundeId: string,
  _prevState: VorgangFormState,
  formData: FormData
): Promise<VorgangFormState> {
  const beraterId = formData.get("beraterId") as string;
  const kanal = formData.get("kanal") as string;
  const wiedervorlageRaw = (formData.get("wiedervorlage") as string) ?? "";
  const notizText = ((formData.get("notiz") as string) ?? "").trim();

  if (!beraterId) {
    return { error: "Bitte Berater auswählen." };
  }
  if (!KANAL_WERTE.includes(kanal as (typeof KANAL_WERTE)[number])) {
    return { error: "Bitte Kanal auswählen." };
  }

  const wiedervorlage = wiedervorlageRaw ? new Date(wiedervorlageRaw) : null;

  const vorgang = await prisma.vorgang.create({
    data: {
      kundeId,
      beraterId,
      kanal: kanal as (typeof KANAL_WERTE)[number],
      status: "ANGEBOT_RAUS",
      wiedervorlage,
      notizen: notizText ? { create: [{ text: notizText }] } : undefined,
    },
  });

  revalidatePath(`/kunden/${kundeId}`);
  redirect(`/vorgaenge/${vorgang.id}`);
}

export type StatusFormState = { error: string | null; ermutigung: string | null };

const ERMUTIGUNGEN = [
  "Nicht jede Anfrage wird zur Buchung – weiter geht's mit dem nächsten Kunden.",
  "Kommt vor. Der nächste Kunde wartet schon.",
  "Schade um diesen einen – der Rest vom Tag zählt genauso.",
];

export async function updateVorgangStatus(
  vorgangId: string,
  _prevState: StatusFormState,
  formData: FormData
): Promise<StatusFormState> {
  const status = formData.get("status") as string;
  const buchungsweg = (formData.get("buchungsweg") as string) || null;
  const verlustgrund = ((formData.get("verlustgrund") as string) ?? "").trim();

  if (status === "GEBUCHT" && !buchungsweg) {
    return { error: "Bitte Buchungsweg auswählen.", ermutigung: null };
  }
  if (status === "VERLOREN" && !verlustgrund) {
    return { error: "Bitte kurzen Verlustgrund angeben.", ermutigung: null };
  }

  const vorgang = await prisma.vorgang.findUnique({ where: { id: vorgangId } });
  if (!vorgang) {
    return { error: "Vorgang nicht gefunden.", ermutigung: null };
  }

  await prisma.vorgang.update({
    where: { id: vorgangId },
    data: {
      status: status as "ANGEBOT_RAUS" | "NACHFASSEN" | "GEBUCHT" | "VERLOREN",
      buchungsweg:
        status === "GEBUCHT"
          ? (buchungsweg as "PERSOENLICH" | "SCHRIFTLICH")
          : null,
      verlustgrund: status === "VERLOREN" ? verlustgrund : null,
    },
  });

  revalidatePath(`/vorgaenge/${vorgangId}`);
  revalidatePath(`/kunden/${vorgang.kundeId}`);
  revalidatePath("/");

  const ermutigung =
    status === "VERLOREN"
      ? ERMUTIGUNGEN[Math.floor(Math.random() * ERMUTIGUNGEN.length)]
      : null;

  return { error: null, ermutigung };
}

export type WiedervorlageFormState = { error: string | null };

export async function updateWiedervorlage(
  vorgangId: string,
  _prevState: WiedervorlageFormState,
  formData: FormData
): Promise<WiedervorlageFormState> {
  const raw = (formData.get("wiedervorlage") as string) ?? "";
  if (!raw) {
    return { error: "Bitte Datum und Uhrzeit angeben." };
  }

  const vorgang = await prisma.vorgang.findUnique({ where: { id: vorgangId } });
  if (!vorgang) {
    return { error: "Vorgang nicht gefunden." };
  }

  await prisma.vorgang.update({
    where: { id: vorgangId },
    data: { wiedervorlage: new Date(raw) },
  });

  revalidatePath(`/vorgaenge/${vorgangId}`);
  return { error: null };
}

export type NotizFormState = { error: string | null };

export async function addNotiz(
  vorgangId: string,
  _prevState: NotizFormState,
  formData: FormData
): Promise<NotizFormState> {
  const text = ((formData.get("text") as string) ?? "").trim();
  if (!text) {
    return { error: "Notiz darf nicht leer sein." };
  }

  const mitarbeiter = await getAktuellerMitarbeiter();

  await prisma.notiz.create({
    data: { vorgangId, text, mitarbeiterId: mitarbeiter?.id },
  });

  revalidatePath(`/vorgaenge/${vorgangId}`);
  return { error: null };
}

export type EinstellungenFormState = { error: string | null };

export async function updateSchwelle(
  _prevState: EinstellungenFormState,
  formData: FormData
): Promise<EinstellungenFormState> {
  const wert = Number(formData.get("schwelle"));
  if (!Number.isInteger(wert) || wert < 1) {
    return { error: "Bitte eine ganze Zahl ab 1 angeben." };
  }

  await prisma.einstellungen.upsert({
    where: { id: 1 },
    update: { schwelleWiederholteAnfragen: wert },
    create: { id: 1, schwelleWiederholteAnfragen: wert },
  });

  revalidatePath("/einstellungen");
  return { error: null };
}

export async function toggleSmileys(formData: FormData) {
  const aktiviert = formData.get("smileysAktiviert") === "on";

  await prisma.einstellungen.upsert({
    where: { id: 1 },
    update: { smileysAktiviert: aktiviert },
    create: { id: 1, smileysAktiviert: aktiviert },
  });

  revalidatePath("/einstellungen");
  revalidatePath("/");
}

export type MergeFormState = { error: string | null };

export async function mergeKunden(
  zielKundeId: string,
  quelleKundeId: string,
  _prevState: MergeFormState,
  _formData: FormData
): Promise<MergeFormState> {
  if (zielKundeId === quelleKundeId) {
    return { error: "Kunde kann nicht mit sich selbst zusammengeführt werden." };
  }

  const [ziel, quelle] = await Promise.all([
    prisma.kunde.findUnique({ where: { id: zielKundeId } }),
    prisma.kunde.findUnique({ where: { id: quelleKundeId } }),
  ]);
  if (!ziel || !quelle) {
    return { error: "Kunde nicht gefunden." };
  }

  await prisma.$transaction([
    prisma.vorgang.updateMany({
      where: { kundeId: quelleKundeId },
      data: { kundeId: zielKundeId },
    }),
    prisma.kunde.update({
      where: { id: zielKundeId },
      data: {
        handynummer: ziel.handynummer ?? quelle.handynummer,
        email: ziel.email ?? quelle.email,
      },
    }),
    prisma.kunde.delete({ where: { id: quelleKundeId } }),
  ]);

  revalidatePath("/kunden");
  revalidatePath(`/kunden/${zielKundeId}`);
  redirect(`/kunden/${zielKundeId}`);
}

export type DeleteKundeFormState = { error: string | null };

export async function deleteKunde(
  kundeId: string,
  _prevState: DeleteKundeFormState,
  _formData: FormData
): Promise<DeleteKundeFormState> {
  const anzahlVorgaenge = await prisma.vorgang.count({ where: { kundeId } });
  if (anzahlVorgaenge > 0) {
    return {
      error:
        "Dieser Kunde hat Vorgänge und kann nicht gelöscht werden. Stattdessen mit einem anderen Kunden zusammenführen.",
    };
  }

  await prisma.kunde.delete({ where: { id: kundeId } });

  revalidatePath("/kunden");
  redirect("/kunden");
}

export async function markiereAnwesend(mitarbeiterId: string) {
  const datum = heutigesDatumString(new Date());

  await prisma.anwesenheit.upsert({
    where: { datum_mitarbeiterId: { datum, mitarbeiterId } },
    update: {},
    create: { datum, mitarbeiterId },
  });

  revalidatePath("/");
}

export type UebernahmeFormState = { error: string | null };

export async function uebernehmeVorgang(
  vorgangId: string,
  _prevState: UebernahmeFormState,
  formData: FormData
): Promise<UebernahmeFormState> {
  const neuerBeraterId = formData.get("neuerBeraterId") as string;
  if (!neuerBeraterId) {
    return { error: "Bitte auswählen, wer übernimmt." };
  }

  const vorgang = await prisma.vorgang.findUnique({
    where: { id: vorgangId },
    include: { berater: true },
  });
  if (!vorgang) {
    return { error: "Vorgang nicht gefunden." };
  }

  const neuerBerater = await prisma.mitarbeiter.findUnique({
    where: { id: neuerBeraterId },
  });
  if (!neuerBerater) {
    return { error: "Mitarbeiter nicht gefunden." };
  }

  await prisma.$transaction([
    prisma.vorgang.update({
      where: { id: vorgangId },
      data: { beraterId: neuerBeraterId },
    }),
    prisma.notiz.create({
      data: {
        vorgangId,
        text: `Übernommen von ${neuerBerater.name} (ursprünglich ${vorgang.berater.name}), da abwesend.`,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath(`/vorgaenge/${vorgangId}`);
  return { error: null };
}
