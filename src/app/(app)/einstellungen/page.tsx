import { getEinstellungen } from "@/lib/einstellungen";
import SchwelleForm from "@/components/SchwelleForm";
import { toggleSmileys } from "@/lib/actions";

export default async function EinstellungenPage() {
  const einstellungen = await getEinstellungen();

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

      <form action={toggleSmileys} className="card p-4 flex items-center gap-2">
        <input
          id="smileysAktiviert"
          name="smileysAktiviert"
          type="checkbox"
          defaultChecked={einstellungen.smileysAktiviert}
          className="accent-[var(--color-primary-600)]"
        />
        <label htmlFor="smileysAktiviert" className="text-sm">
          Smileys anzeigen
        </label>
        <button type="submit" className="btn-secondary py-1 text-sm ml-auto">
          Speichern
        </button>
      </form>
    </main>
  );
}
