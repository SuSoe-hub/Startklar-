import {
  berechneRangliste,
  berechneUeberraschungsFortschritt,
} from "@/lib/rangliste";
import { getEinstellungen } from "@/lib/einstellungen";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import Rangliste from "@/components/Rangliste";
import UeberraschungsFortschritt from "@/components/UeberraschungsFortschritt";

export default async function RanglistePage() {
  const jetzt = new Date();
  const [eintraege, ueberraschungsEintraege, einstellungen, aktuellerMitarbeiter] =
    await Promise.all([
      berechneRangliste(jetzt),
      berechneUeberraschungsFortschritt(),
      getEinstellungen(),
      getAktuellerMitarbeiter(),
    ]);

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold tracking-tight">Statistik</h1>
      <Rangliste
        eintraege={eintraege}
        eigeneId={aktuellerMitarbeiter?.id ?? null}
        smileysAktiviert={einstellungen.smileysAktiviert}
      />
      <UeberraschungsFortschritt
        eintraege={ueberraschungsEintraege}
        eigeneId={aktuellerMitarbeiter?.id ?? null}
      />
    </main>
  );
}
