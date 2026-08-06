import { berechneRangliste } from "@/lib/rangliste";
import { getEinstellungen } from "@/lib/einstellungen";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import Rangliste from "@/components/Rangliste";

export default async function RanglistePage() {
  const jetzt = new Date();
  const [eintraege, einstellungen, aktuellerMitarbeiter] = await Promise.all([
    berechneRangliste(jetzt),
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
    </main>
  );
}
