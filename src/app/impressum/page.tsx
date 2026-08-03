import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum – Startklar",
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto card p-8">
        <Link href="/" className="link text-sm">
          ← Zurück
        </Link>

        <h1 className="text-2xl font-extrabold mt-4 mb-6 text-[var(--color-primary-700)]">
          Impressum
        </h1>

        <div className="space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-bold mb-1">Angaben gemäß § 5 TMG, § 18 Abs. 2 MStV</h2>
            <p>
              TCE-Reisen GmbH
              <br />
              Flughafenstr. 100
              <br />
              90411 Nürnberg
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">Vertreten durch</h2>
            <p>Susanna Sözeri</p>
          </section>

          <section>
            <h2 className="font-bold mb-1">Kontakt</h2>
            <p>
              Telefon: 0911 366510
              <br />
              E-Mail: susanna.soezeri@tce-reisen.com
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">Registereintrag</h2>
            <p>
              Handelsregister: HRB 11288
              <br />
              Registergericht: Amtsgericht Nürnberg
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
              <br />
              DE195903724
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">
              Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV
            </h2>
            <p>
              Susanna Sözeri
              <br />
              Flughafenstr. 100, 90411 Nürnberg
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">Hinweis</h2>
            <p>
              Startklar ist ein internes Arbeitswerkzeug der TCE-Reisen GmbH
              für Mitarbeiterinnen und Mitarbeiter und nicht öffentlich
              zugänglich. Dieses Impressum wird trotzdem bereitgestellt, da
              die Anwendung personenbezogene Daten verarbeitet.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
