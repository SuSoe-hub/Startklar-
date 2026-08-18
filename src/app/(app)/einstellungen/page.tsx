import { prisma } from "@/lib/prisma";
import { getEinstellungen } from "@/lib/einstellungen";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import SchwelleForm from "@/components/SchwelleForm";
import VeranstalterZeile from "@/components/VeranstalterZeile";
import VeranstalterHinzufuegenForm from "@/components/VeranstalterHinzufuegenForm";
import MitarbeiterPinForm from "@/components/MitarbeiterPinForm";
import LoeschregelPanel from "@/components/LoeschregelPanel";
import { toggleSmileys } from "@/lib/actions";

export default async function EinstellungenPage() {
  const [einstellungen, veranstalterListe, aktuellerMitarbeiter, alleMitarbeiter] =
    await Promise.all([
      getEinstellungen(),
      prisma.veranstalter.findMany({ orderBy: { code: "asc" } }),
      getAktuellerMitarbeiter(),
      prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
    ]);

  return (
    <main className="p-6 md:p-8 max-w-md mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold tracking-tight">Einstellungen</h1>
      <div className="card p-4 flex flex-col gap-3">
        <SchwelleForm
          aktuellerWert={einstellungen.schwelleWiederholteAnfragen}
        />
        <p className="text-xs text-[var(--color-muted)]">
          Ab dieser Anzahl von Vorgängen ohne Buchung innerhalb von 12 Monaten
          erscheint beim Anlegen eines neuen Vorgangs ein Hinweis.
        </p>
      </div>

      <form action={toggleSmileys} className="card p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            id="smileysAktiviert"
            name="smileysAktiviert"
            type="checkbox"
            defaultChecked={einstellungen.smileysAktiviert}
            className="accent-[var(--color-primary-600)]"
          />
          <label htmlFor="smileysAktiviert" className="text-sm">
            Smileys &amp; Rückmeldungen anzeigen
          </label>
          <button type="submit" className="btn-secondary py-1 text-sm ml-auto">
            Speichern
          </button>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          Steuert auch die kurzen, aufmunternden Rückmeldungen (z. B. „Alles
          abgearbeitet – heute wartet kein Kunde.").
        </p>
      </form>

      <div className="card p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Veranstalter für Optionen</h2>
        <p className="text-xs text-[var(--color-muted)]">
          Feste Auswahlliste beim Anlegen einer Option. „Sonstige" mit
          Freitextfeld steht dort zusätzlich immer zur Verfügung und muss
          hier nicht extra gepflegt werden.
        </p>
        <ul className="flex flex-col gap-1">
          {veranstalterListe.map((v) => (
            <VeranstalterZeile key={v.id} veranstalterId={v.id} code={v.code} />
          ))}
        </ul>
        <VeranstalterHinzufuegenForm />
      </div>

      {aktuellerMitarbeiter?.istAdmin && (
        <div className="card p-4 flex flex-col gap-3">
          <h2 className="font-semibold">Mitarbeiter-PINs (nur Admin)</h2>
          <p className="text-xs text-[var(--color-muted)]">
            Hier legst du für neue Kolleg:innen die erste PIN fest oder setzt
            eine vergessene PIN zurück. Aus Sicherheitsgründen kann sich
            niemand mehr selbst eine PIN für einen fremden Namen vergeben.
          </p>
          <ul className="flex flex-col gap-3">
            {alleMitarbeiter.map((m) => (
              <MitarbeiterPinForm
                key={m.id}
                mitarbeiterId={m.id}
                name={m.name}
                hatPin={!!m.pinHash}
              />
            ))}
          </ul>
        </div>
      )}

      {aktuellerMitarbeiter?.istAdmin && <LoeschregelPanel />}
    </main>
  );
}
