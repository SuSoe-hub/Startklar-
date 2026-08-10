"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { heutigesDatumString } from "@/lib/teampool";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import { parseBerlinDatetimeLocal, BERLIN_TZ } from "@/lib/zeit";
import {
  pruefeErsterVorgang,
  pruefeZehnVorgaengeHeute,
  pruefeFuenfzigVorgaenge,
  pruefeAlleWiedervorlagenErledigt,
  pruefeOptionRechtzeitig,
  pruefeUebernommen,
} from "@/lib/anerkennung";

export type DuplicateHinweis = {
  kundeId: string;
  name: string;
  handyTreffer: boolean;
  emailTreffer: boolean;
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
    handyTreffer: !!handy && kunde.handynummer === handy,
    emailTreffer: !!mail && kunde.email === mail,
    letzteBeratung: letzterVorgang
      ? {
          datum: letzterVorgang.erstelltAm.toLocaleDateString("de-DE", {
            timeZone: BERLIN_TZ,
            day: "2-digit",
            month: "2-digit",
          }),
          berater: letzterVorgang.berater.name,
        }
      : null,
  };
}

export type KundeFormState = {
  error: string | null;
  vorname: string;
  nachname: string;
  typ: string;
  handynummer: string;
  email: string;
};

export async function createKunde(
  prevState: KundeFormState,
  formData: FormData
): Promise<KundeFormState> {
  const vorname = ((formData.get("vorname") as string) ?? "").trim();
  const nachname = ((formData.get("nachname") as string) ?? "").trim();
  const handynummerEingabe = ((formData.get("handynummer") as string) ?? "").trim();
  const emailEingabe = ((formData.get("email") as string) ?? "").trim();
  const handynummer = handynummerEingabe || null;
  const email = emailEingabe || null;
  const typ = formData.get("typ") as string;

  // Bei einem Validierungsfehler setzt React/Next das native <form> zurück
  // (siehe VorgangStatusForm) - deshalb geben wir die eingegebenen Werte
  // hier immer mit zurück, damit das Formular sie wiederherstellen kann,
  // statt sie zu verlieren.
  const eingabe = {
    vorname,
    nachname,
    typ: typ ?? "",
    handynummer: handynummerEingabe,
    email: emailEingabe,
  };

  if (!vorname || !nachname) {
    return { error: "Vorname und Nachname sind Pflichtfelder.", ...eingabe };
  }
  if (typ !== "NEUKUNDE" && typ !== "STAMMKUNDE") {
    return { error: "Bitte Kundentyp auswählen.", ...eingabe };
  }
  // Speicherregel: Name plus mindestens ein Kontaktweg.
  if (!handynummer && !email) {
    return {
      error:
        "Mindestens ein Kontaktweg (Handynummer oder E-Mail) wird benötigt.",
      ...eingabe,
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

export async function updateKunde(
  kundeId: string,
  prevState: KundeFormState,
  formData: FormData
): Promise<KundeFormState> {
  const vorname = ((formData.get("vorname") as string) ?? "").trim();
  const nachname = ((formData.get("nachname") as string) ?? "").trim();
  const handynummerEingabe = ((formData.get("handynummer") as string) ?? "").trim();
  const emailEingabe = ((formData.get("email") as string) ?? "").trim();
  const handynummer = handynummerEingabe || null;
  const email = emailEingabe || null;
  const typ = formData.get("typ") as string;

  const eingabe = {
    vorname,
    nachname,
    typ: typ ?? "",
    handynummer: handynummerEingabe,
    email: emailEingabe,
  };

  if (!vorname || !nachname) {
    return { error: "Vorname und Nachname sind Pflichtfelder.", ...eingabe };
  }
  if (typ !== "NEUKUNDE" && typ !== "STAMMKUNDE") {
    return { error: "Bitte Kundentyp auswählen.", ...eingabe };
  }
  if (!handynummer && !email) {
    return {
      error:
        "Mindestens ein Kontaktweg (Handynummer oder E-Mail) wird benötigt.",
      ...eingabe,
    };
  }

  await prisma.kunde.update({
    where: { id: kundeId },
    data: {
      vorname,
      nachname,
      handynummer,
      email,
      typ: typ as "NEUKUNDE" | "STAMMKUNDE",
    },
  });

  revalidatePath("/kunden");
  revalidatePath(`/kunden/${kundeId}`);
  redirect(`/kunden/${kundeId}`);
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

  const wiedervorlage = wiedervorlageRaw
    ? parseBerlinDatetimeLocal(wiedervorlageRaw)
    : null;

  let zielUrl: string;
  try {
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

    const jetzt = new Date();
    const anerkennung =
      (await pruefeErsterVorgang(beraterId, jetzt)) ??
      (await pruefeZehnVorgaengeHeute(beraterId, jetzt)) ??
      (await pruefeFuenfzigVorgaenge(beraterId, jetzt));

    zielUrl = `/vorgaenge/${vorgang.id}${
      anerkennung ? `?anerkennung=${encodeURIComponent(anerkennung)}` : ""
    }`;
  } catch (fehler) {
    console.error("createVorgang fehlgeschlagen:", fehler);
    return { error: "Speichern fehlgeschlagen, bitte erneut versuchen." };
  }

  // redirect() wirft intern ein spezielles Next.js-Signal – bewusst außerhalb
  // des try/catch, damit es nicht versehentlich als Fehler abgefangen wird.
  redirect(zielUrl);
}

export type StatusFormState = {
  error: string | null;
  ermutigung: string | null;
  anerkennung: string | null;
  // Wird bei jedem Abschluss der Aktion (Erfolg ODER Fehler) mit
  // zurückgegeben, damit die Formularfelder im Client hart auf diesen Wert
  // zurückgesetzt werden können. Grund: React/Next setzen das native
  // <form>-Element nach jeder Server Action zurück, was kontrollierte
  // <select>-Elemente optisch von ihrem eigentlichen Wert abweichen lassen
  // kann (der Select zeigt dann z. B. wieder den Ausgangsstatus, obwohl der
  // Nutzer "Option" gewählt hatte). Ohne dieses Echo lässt sich das nicht
  // zuverlässig erkennen.
  status: string;
  buchungsweg: string | null;
  verlustgrund: string | null;
};

const ERMUTIGUNGEN = [
  "Nicht jede Anfrage wird zur Buchung – weiter geht's mit dem nächsten Kunden.",
  "Kommt vor. Der nächste Kunde wartet schon.",
  "Kopf hoch und glaube an dich!",
];

const OPTIONSART_WERTE = ["KUNDENOPTION", "INTERN"] as const;
const STATUS_WERTE = [
  "ANGEBOT_RAUS",
  "OPTION",
  "NACHFASSEN",
  "GEBUCHT",
  "VERLOREN",
] as const;

export async function updateVorgangStatus(
  vorgangId: string,
  _prevState: StatusFormState,
  formData: FormData
): Promise<StatusFormState> {
  const status = formData.get("status") as string;
  const buchungsweg = (formData.get("buchungsweg") as string) || null;
  const verlustgrund = ((formData.get("verlustgrund") as string) ?? "").trim();

  if (!STATUS_WERTE.includes(status as (typeof STATUS_WERTE)[number])) {
    return {
      error: "Ungültiger Status.",
      ermutigung: null,
      anerkennung: null,
      status: "ANGEBOT_RAUS",
      buchungsweg: null,
      verlustgrund: null,
    };
  }
  if (status === "GEBUCHT" && !buchungsweg) {
    return {
      error: "Bitte Buchungsweg auswählen.",
      ermutigung: null,
      anerkennung: null,
      status,
      buchungsweg: null,
      verlustgrund: null,
    };
  }
  if (status === "VERLOREN" && !verlustgrund) {
    return {
      error: "Bitte kurzen Verlustgrund angeben.",
      ermutigung: null,
      anerkennung: null,
      status,
      buchungsweg: null,
      verlustgrund: null,
    };
  }

  try {
    const vorgang = await prisma.vorgang.findUnique({ where: { id: vorgangId } });
    if (!vorgang) {
      return {
        error: "Vorgang nicht gefunden.",
        ermutigung: null,
        anerkennung: null,
        status,
        buchungsweg,
        verlustgrund: verlustgrund || null,
      };
    }

    if (status === "OPTION") {
      const optionsArt = formData.get("optionsArt") as string;
      const vorgangsnummer = (
        (formData.get("optionVorgangsnummer") as string) ?? ""
      ).trim();
      const veranstalterId = (formData.get("optionVeranstalterId") as string) || "";
      const veranstalterSonstige = (
        (formData.get("optionVeranstalterSonstige") as string) ?? ""
      ).trim();
      const fristRaw = (formData.get("optionsfrist") as string) ?? "";
      const optionNotiz = ((formData.get("optionNotiz") as string) ?? "").trim();

      if (
        !OPTIONSART_WERTE.includes(
          optionsArt as (typeof OPTIONSART_WERTE)[number]
        )
      ) {
        return {
          error: "Bitte Optionsart auswählen.",
          ermutigung: null,
          anerkennung: null,
          status,
          buchungsweg: null,
          verlustgrund: null,
        };
      }
      if (!vorgangsnummer) {
        return {
          error: "Bitte Vorgangsnummer beim Veranstalter angeben.",
          ermutigung: null,
          anerkennung: null,
          status,
          buchungsweg: null,
          verlustgrund: null,
        };
      }
      if (!veranstalterId) {
        return {
          error: "Bitte Veranstalter auswählen.",
          ermutigung: null,
          anerkennung: null,
          status,
          buchungsweg: null,
          verlustgrund: null,
        };
      }
      if (veranstalterId === "SONSTIGE" && !veranstalterSonstige) {
        return {
          error: "Bitte Namen des Veranstalters eintragen.",
          ermutigung: null,
          anerkennung: null,
          status,
          buchungsweg: null,
          verlustgrund: null,
        };
      }
      if (!fristRaw) {
        return {
          error: "Bitte Optionsfrist angeben.",
          ermutigung: null,
          anerkennung: null,
          status,
          buchungsweg: null,
          verlustgrund: null,
        };
      }

      await prisma.vorgang.update({
        where: { id: vorgangId },
        data: {
          status: "OPTION",
          vorherigerStatus: vorgang.status,
          optionsArt: optionsArt as (typeof OPTIONSART_WERTE)[number],
          optionVorgangsnummer: vorgangsnummer,
          optionVeranstalterId:
            veranstalterId === "SONSTIGE" ? null : veranstalterId,
          optionVeranstalterSonstige:
            veranstalterId === "SONSTIGE" ? veranstalterSonstige : null,
          optionsfrist: parseBerlinDatetimeLocal(fristRaw),
          optionNotiz: optionNotiz || null,
          buchungsweg: null,
          verlustgrund: null,
        },
      });
    } else {
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
    }

    revalidatePath(`/vorgaenge/${vorgangId}`);
    revalidatePath(`/kunden/${vorgang.kundeId}`);
    revalidatePath("/");

    const ermutigung =
      status === "VERLOREN"
        ? ERMUTIGUNGEN[Math.floor(Math.random() * ERMUTIGUNGEN.length)]
        : null;

    const jetzt = new Date();
    const aktuellerMitarbeiter = await getAktuellerMitarbeiter();
    let anerkennung: string | null = null;
    if (aktuellerMitarbeiter) {
      if (vorgang.status === "OPTION" && status === "GEBUCHT") {
        anerkennung = await pruefeOptionRechtzeitig(
          aktuellerMitarbeiter.id,
          jetzt,
          vorgang.optionsfrist
        );
      }
      if (!anerkennung) {
        anerkennung = await pruefeAlleWiedervorlagenErledigt(
          aktuellerMitarbeiter.id,
          jetzt
        );
      }
    }

    return {
      error: null,
      ermutigung,
      anerkennung,
      status,
      buchungsweg: status === "GEBUCHT" ? buchungsweg : null,
      verlustgrund: status === "VERLOREN" ? verlustgrund : null,
    };
  } catch (fehler) {
    console.error("updateVorgangStatus fehlgeschlagen:", fehler);
    return {
      error: "Speichern fehlgeschlagen, bitte erneut versuchen.",
      ermutigung: null,
      anerkennung: null,
      status,
      buchungsweg,
      verlustgrund: verlustgrund || null,
    };
  }
}

export type OptionVerlaengertFormState = {
  error: string | null;
  anerkennung: string | null;
};

export async function verlaengereOption(
  vorgangId: string,
  _prevState: OptionVerlaengertFormState,
  formData: FormData
): Promise<OptionVerlaengertFormState> {
  const fristRaw = (formData.get("optionsfrist") as string) ?? "";
  if (!fristRaw) {
    return { error: "Bitte neue Frist angeben.", anerkennung: null };
  }

  try {
    const vorgang = await prisma.vorgang.findUnique({ where: { id: vorgangId } });
    if (!vorgang) {
      return { error: "Vorgang nicht gefunden.", anerkennung: null };
    }
    if (vorgang.status !== "OPTION") {
      return { error: "Vorgang ist keine offene Option mehr.", anerkennung: null };
    }

    const alteFrist = vorgang.optionsfrist;
    const neueFrist = parseBerlinDatetimeLocal(fristRaw);

    await prisma.$transaction([
      prisma.vorgang.update({
        where: { id: vorgangId },
        data: { optionsfrist: neueFrist },
      }),
      prisma.notiz.create({
        data: {
          vorgangId,
          text: `Option verlängert: bisherige Frist ${
            alteFrist?.toLocaleString("de-DE", { timeZone: BERLIN_TZ }) ??
            "unbekannt"
          }, neue Frist ${neueFrist.toLocaleString("de-DE", {
            timeZone: BERLIN_TZ,
          })}.`,
        },
      }),
    ]);

    revalidatePath(`/vorgaenge/${vorgangId}`);
    revalidatePath("/");

    const jetzt = new Date();
    const aktuellerMitarbeiter = await getAktuellerMitarbeiter();
    const anerkennung = aktuellerMitarbeiter
      ? await pruefeOptionRechtzeitig(aktuellerMitarbeiter.id, jetzt, alteFrist)
      : null;

    return { error: null, anerkennung };
  } catch (fehler) {
    console.error("verlaengereOption fehlgeschlagen:", fehler);
    return { error: "Speichern fehlgeschlagen, bitte erneut versuchen.", anerkennung: null };
  }
}

export type OptionAufloesenFormState = {
  error: string | null;
  anerkennung: string | null;
};

export async function loeseOptionAuf(
  vorgangId: string,
  _prevState: OptionAufloesenFormState,
  formData: FormData
): Promise<OptionAufloesenFormState> {
  const kundeHatAbgesagt = formData.get("kundeHatAbgesagt") === "on";
  const verlustgrund = ((formData.get("verlustgrund") as string) ?? "").trim();

  try {
    const vorgang = await prisma.vorgang.findUnique({ where: { id: vorgangId } });
    if (!vorgang) {
      return { error: "Vorgang nicht gefunden.", anerkennung: null };
    }
    if (vorgang.status !== "OPTION") {
      return { error: "Vorgang ist keine offene Option mehr.", anerkennung: null };
    }

    let neuerStatus: "NACHFASSEN" | "ANGEBOT_RAUS" | "VERLOREN";
    let neuerVerlustgrund: string | null = null;
    let notizText: string;

    if (vorgang.optionsArt === "INTERN") {
      // Kunde weiß nichts von der Reservierung – nie eine kundengerichtete
      // Aktion, deshalb einfach zurück zum Status vor der Option.
      neuerStatus =
        vorgang.vorherigerStatus === "ANGEBOT_RAUS" ? "ANGEBOT_RAUS" : "NACHFASSEN";
      notizText =
        "Interne Option aufgelöst (beim Veranstalter storniert). Kunde wurde nicht kontaktiert.";
    } else if (kundeHatAbgesagt) {
      if (!verlustgrund) {
        return {
          error: "Bitte kurz angeben, warum der Kunde abgesagt hat.",
          anerkennung: null,
        };
      }
      neuerStatus = "VERLOREN";
      neuerVerlustgrund = verlustgrund;
      notizText = "Option aufgelöst: Kunde hat abgesagt.";
    } else {
      neuerStatus = "NACHFASSEN";
      notizText =
        "Option aufgelöst (beim Veranstalter storniert), Kunde entscheidet sich noch.";
    }

    await prisma.$transaction([
      prisma.vorgang.update({
        where: { id: vorgangId },
        data: { status: neuerStatus, verlustgrund: neuerVerlustgrund },
      }),
      prisma.notiz.create({ data: { vorgangId, text: notizText } }),
    ]);

    revalidatePath(`/vorgaenge/${vorgangId}`);
    revalidatePath(`/kunden/${vorgang.kundeId}`);
    revalidatePath("/");

    const jetzt = new Date();
    const aktuellerMitarbeiter = await getAktuellerMitarbeiter();
    const anerkennung = aktuellerMitarbeiter
      ? await pruefeOptionRechtzeitig(
          aktuellerMitarbeiter.id,
          jetzt,
          vorgang.optionsfrist
        )
      : null;

    return { error: null, anerkennung };
  } catch (fehler) {
    console.error("loeseOptionAuf fehlgeschlagen:", fehler);
    return { error: "Speichern fehlgeschlagen, bitte erneut versuchen.", anerkennung: null };
  }
}

export type AngebotLinkFormState = { error: string | null };

export async function updateAngebotLink(
  vorgangId: string,
  _prevState: AngebotLinkFormState,
  formData: FormData
): Promise<AngebotLinkFormState> {
  const raw = ((formData.get("angebotLink") as string) ?? "").trim();
  if (raw && !/^https?:\/\//i.test(raw)) {
    return { error: "Bitte einen vollständigen Link (mit http:// oder https://) eingeben." };
  }

  try {
    await prisma.vorgang.update({
      where: { id: vorgangId },
      data: { angebotLink: raw || null },
    });
    revalidatePath(`/vorgaenge/${vorgangId}`);
    return { error: null };
  } catch (fehler) {
    console.error("updateAngebotLink fehlgeschlagen:", fehler);
    return { error: "Speichern fehlgeschlagen, bitte erneut versuchen." };
  }
}

export type WiedervorlageFormState = {
  error: string | null;
  anerkennung: string | null;
};

export async function updateWiedervorlage(
  vorgangId: string,
  _prevState: WiedervorlageFormState,
  formData: FormData
): Promise<WiedervorlageFormState> {
  const raw = (formData.get("wiedervorlage") as string) ?? "";
  if (!raw) {
    return { error: "Bitte Datum und Uhrzeit angeben.", anerkennung: null };
  }

  try {
    const vorgang = await prisma.vorgang.findUnique({ where: { id: vorgangId } });
    if (!vorgang) {
      return { error: "Vorgang nicht gefunden.", anerkennung: null };
    }

    await prisma.vorgang.update({
      where: { id: vorgangId },
      data: { wiedervorlage: parseBerlinDatetimeLocal(raw) },
    });

    revalidatePath(`/vorgaenge/${vorgangId}`);

    const jetzt = new Date();
    const aktuellerMitarbeiter = await getAktuellerMitarbeiter();
    const anerkennung = aktuellerMitarbeiter
      ? await pruefeAlleWiedervorlagenErledigt(aktuellerMitarbeiter.id, jetzt)
      : null;

    return { error: null, anerkennung };
  } catch (fehler) {
    console.error("updateWiedervorlage fehlgeschlagen:", fehler);
    return { error: "Speichern fehlgeschlagen, bitte erneut versuchen.", anerkennung: null };
  }
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

export type UpdateNotizFormState = { error: string | null; text: string };

export async function updateNotiz(
  notizId: string,
  vorgangId: string,
  _prevState: UpdateNotizFormState,
  formData: FormData
): Promise<UpdateNotizFormState> {
  const rawText = (formData.get("text") as string) ?? "";
  const text = rawText.trim();
  if (!text) {
    return { error: "Notiz darf nicht leer sein.", text: rawText };
  }

  const mitarbeiter = await getAktuellerMitarbeiter();
  const notiz = await prisma.notiz.findUnique({ where: { id: notizId } });
  if (!notiz || !mitarbeiter || notiz.mitarbeiterId !== mitarbeiter.id) {
    return { error: "Diese Notiz darfst du nicht bearbeiten.", text: rawText };
  }

  await prisma.notiz.update({
    where: { id: notizId },
    data: { text, bearbeitetAm: new Date() },
  });

  revalidatePath(`/vorgaenge/${vorgangId}`);
  return { error: null, text };
}

export type DeleteNotizFormState = { error: string | null };

export async function deleteNotiz(
  notizId: string,
  vorgangId: string,
  _prevState: DeleteNotizFormState,
  _formData: FormData
): Promise<DeleteNotizFormState> {
  const mitarbeiter = await getAktuellerMitarbeiter();
  const notiz = await prisma.notiz.findUnique({ where: { id: notizId } });
  if (!notiz || !mitarbeiter || notiz.mitarbeiterId !== mitarbeiter.id) {
    return { error: "Diese Notiz darfst du nicht löschen." };
  }

  await prisma.notiz.delete({ where: { id: notizId } });

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
  formData: FormData
): Promise<DeleteKundeFormState> {
  const mitVorgaengen = formData.get("mitVorgaengen") === "on";
  const anzahlVorgaenge = await prisma.vorgang.count({ where: { kundeId } });

  if (anzahlVorgaenge > 0 && !mitVorgaengen) {
    return {
      error:
        "Dieser Kunde hat Vorgänge und kann nicht gelöscht werden. Stattdessen mit einem anderen Kunden zusammenführen, oder die Vorgänge mit löschen.",
    };
  }

  await prisma.$transaction([
    prisma.notiz.deleteMany({ where: { vorgang: { kundeId } } }),
    prisma.vorgang.deleteMany({ where: { kundeId } }),
    prisma.kunde.delete({ where: { id: kundeId } }),
  ]);

  revalidatePath("/kunden");
  redirect("/kunden");
}

export type DeleteVorgangFormState = { error: string | null };

export async function deleteVorgang(
  vorgangId: string,
  _prevState: DeleteVorgangFormState,
  _formData: FormData
): Promise<DeleteVorgangFormState> {
  const vorgang = await prisma.vorgang.findUnique({
    where: { id: vorgangId },
    select: { kundeId: true },
  });
  if (!vorgang) {
    return { error: "Vorgang nicht gefunden." };
  }

  await prisma.$transaction([
    prisma.notiz.deleteMany({ where: { vorgangId } }),
    prisma.vorgang.delete({ where: { id: vorgangId } }),
  ]);

  revalidatePath(`/kunden/${vorgang.kundeId}`);
  redirect(`/kunden/${vorgang.kundeId}`);
}

export type VeranstalterFormState = { error: string | null };

export async function addVeranstalter(
  _prevState: VeranstalterFormState,
  formData: FormData
): Promise<VeranstalterFormState> {
  const code = ((formData.get("code") as string) ?? "").trim().toUpperCase();
  if (!code) {
    return { error: "Bitte ein Kürzel eingeben." };
  }
  if (code === "SONSTIGE") {
    return { error: "„Sonstige“ ist bereits fest eingebaut." };
  }

  const bestehend = await prisma.veranstalter.findUnique({ where: { code } });
  if (bestehend) {
    return { error: "Dieses Kürzel gibt es schon." };
  }

  await prisma.veranstalter.create({ data: { code } });
  revalidatePath("/einstellungen");
  return { error: null };
}

export async function removeVeranstalter(
  veranstalterId: string,
  _prevState: VeranstalterFormState,
  _formData: FormData
): Promise<VeranstalterFormState> {
  const inVerwendung = await prisma.vorgang.count({
    where: { optionVeranstalterId: veranstalterId },
  });
  if (inVerwendung > 0) {
    return {
      error:
        "Dieser Veranstalter wird noch bei mindestens einer Option verwendet und kann deshalb nicht gelöscht werden.",
    };
  }

  await prisma.veranstalter.delete({ where: { id: veranstalterId } });
  revalidatePath("/einstellungen");
  return { error: null };
}

// Nur der eingeloggte Mitarbeiter darf sich selbst als anwesend markieren -
// serverseitig geprüft, damit sich niemand über einen fremden Klick oder
// einen direkten Aufruf für einen Kollegen "eintragen" kann.
export async function markiereAnwesend(mitarbeiterId: string) {
  const aktuellerMitarbeiter = await getAktuellerMitarbeiter();
  if (!aktuellerMitarbeiter || aktuellerMitarbeiter.id !== mitarbeiterId) {
    return;
  }

  const datum = heutigesDatumString(new Date());

  await prisma.anwesenheit.upsert({
    where: { datum_mitarbeiterId: { datum, mitarbeiterId } },
    update: {},
    create: { datum, mitarbeiterId },
  });

  revalidatePath("/");
}

// Korrekturmöglichkeit bei Fehlklick.
export async function entferneAnwesend(mitarbeiterId: string) {
  const aktuellerMitarbeiter = await getAktuellerMitarbeiter();
  if (!aktuellerMitarbeiter || aktuellerMitarbeiter.id !== mitarbeiterId) {
    return;
  }

  const datum = heutigesDatumString(new Date());

  await prisma.anwesenheit.deleteMany({ where: { datum, mitarbeiterId } });

  revalidatePath("/");
}

export type UebernahmeFormState = {
  error: string | null;
  anerkennung: string | null;
};

export async function uebernehmeVorgang(
  vorgangId: string,
  _prevState: UebernahmeFormState,
  formData: FormData
): Promise<UebernahmeFormState> {
  const neuerBeraterId = formData.get("neuerBeraterId") as string;
  if (!neuerBeraterId) {
    return { error: "Bitte auswählen, wer übernimmt.", anerkennung: null };
  }

  try {
    const vorgang = await prisma.vorgang.findUnique({
      where: { id: vorgangId },
      include: { berater: true },
    });
    if (!vorgang) {
      return { error: "Vorgang nicht gefunden.", anerkennung: null };
    }

    const neuerBerater = await prisma.mitarbeiter.findUnique({
      where: { id: neuerBeraterId },
    });
    if (!neuerBerater) {
      return { error: "Mitarbeiter nicht gefunden.", anerkennung: null };
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

    const anerkennung = await pruefeUebernommen(neuerBeraterId, new Date());

    return { error: null, anerkennung };
  } catch (fehler) {
    console.error("uebernehmeVorgang fehlgeschlagen:", fehler);
    return { error: "Speichern fehlgeschlagen, bitte erneut versuchen.", anerkennung: null };
  }
}
