import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Startklar",
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto card p-8">
        <Link href="/" className="link text-sm">
          ← Zurück
        </Link>

        <h1 className="text-2xl font-extrabold mt-4 mb-2 text-[var(--color-primary-700)]">
          Datenschutzerklärung
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Für die interne Anwendung „Startklar" der TCE-Reisen GmbH. Stand:
          03.08.2026.
        </p>

        <div className="space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-bold mb-1">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der EU-Datenschutzgrundverordnung
              (DSGVO) ist:
              <br />
              TCE-Reisen GmbH, Flughafenstr. 100, 90411 Nürnberg
              <br />
              Telefon: 0911 366510
              <br />
              E-Mail: susanna.soezeri@tce-reisen.com
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">2. Was ist Startklar?</h2>
            <p>
              Startklar ist ein internes Arbeitswerkzeug für Mitarbeiterinnen
              und Mitarbeiter der TCE-Reisen GmbH. Es hilft dem Team, den
              Überblick über laufende Kundenanfragen und Reisebuchungsvorgänge
              zu behalten (z. B. wer sich um welche Anfrage kümmert und wann
              eine Rückmeldung fällig ist). Die Anwendung ist nicht öffentlich
              zugänglich und richtet sich ausschließlich an das eigene
              Personal.
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">
              3. Welche Daten wir verarbeiten und warum
            </h2>
            <p className="font-semibold mt-2 mb-1">a) Kundendaten</p>
            <p>
              Zur Bearbeitung von Beratungs- und Buchungsanfragen speichern
              wir: Vorname, Nachname, Telefonnummer und/oder E-Mail-Adresse,
              sowie Angaben zum jeweiligen Vorgang (z. B. gewählter
              Kontaktkanal, Bearbeitungsstatus, Buchungsweg, Notizen zum
              Anliegen, Wiedervorlagetermine, Grund bei entgangenen
              Buchungen). Rechtsgrundlage ist Art. 6 Abs. 1 S. 1 lit. b DSGVO
              (Anbahnung und Erfüllung eines Vertrags mit Ihnen als Kundin
              oder Kunde) sowie Art. 6 Abs. 1 S. 1 lit. f DSGVO (unser
              berechtigtes Interesse an einer geordneten internen
              Bearbeitung von Anfragen).
            </p>
            <p className="font-semibold mt-3 mb-1">b) Mitarbeiterdaten</p>
            <p>
              Für die Anmeldung in Startklar speichern wir den Namen jedes
              Teammitglieds sowie eine persönliche PIN. Die PIN wird
              ausschließlich als kryptographischer Hashwert (nicht im
              Klartext) gespeichert, sodass sie auch für uns nicht einsehbar
              ist. Beim Login wird zusätzlich ein Sitzungstoken in einem
              Cookie im Browser abgelegt, damit die Anmeldung erhalten
              bleibt. Außerdem erfassen wir, an welchen Tagen ein
              Teammitglied im Büro anwesend ist (Teampool-Funktion), um
              Vertretungen im Krankheits- oder Urlaubsfall zu organisieren.
              Rechtsgrundlage ist Art. 6 Abs. 1 S. 1 lit. f DSGVO
              (berechtigtes Interesse an einer funktionierenden internen
              Organisation) i. V. m. § 26 BDSG (Datenverarbeitung im
              Beschäftigungsverhältnis).
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">4. Cookies</h2>
            <p>
              Startklar setzt zwei Cookies, beide ausschließlich technisch
              notwendig für den Betrieb der Anwendung selbst (Art. 6 Abs. 1
              S. 1 lit. f DSGVO bzw. § 25 Abs. 2 TTDSG):
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                ein Sitzungscookie, das nach dem Login die Anmeldung für bis
                zu 90 Tage speichert (mit zusätzlichem Inaktivitäts-Timeout
                nach 30 Minuten, siehe unten);
              </li>
              <li>
                ein kleines Cookie, das sich merkt, ob einem Teammitglied
                bereits eine kurze Anerkennungs-Rückmeldung (z. B. bei
                besonders vielen erledigten Vorgängen an einem Tag) gezeigt
                wurde, damit diese höchstens einmal pro Tag erscheint. Es
                zählt oder speichert nichts dauerhaft und verfällt nach 24
                Stunden.
              </li>
            </ul>
            <p className="mt-2">
              Beide Cookies dienen ausschließlich der Bereitstellung der
              Anwendung selbst, keinem Tracking, keiner Analyse und keinem
              Marketing. Es werden keine Analyse-Werkzeuge oder
              Drittanbieter-Skripte (z. B. Google Analytics, Werbe- oder
              Social-Media-Plug-ins) eingesetzt, daher ist kein
              Cookie-Consent-Banner erforderlich.
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">
              5. Empfänger und Auftragsverarbeiter
            </h2>
            <p>
              Startklar wird technisch betrieben mithilfe folgender
              Dienstleister als Auftragsverarbeiter:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Vercel Inc.</strong> – Hosting und Betrieb der
                Anwendung (Serverstandort Frankfurt/EU, siehe Ziff. 6). Es
                gilt Vercels Standard-Auftragsverarbeitungsvertrag (Data
                Processing Addendum), der über die Vercel-Nutzungsbedingungen
                automatisch eingeschlossen ist.
              </li>
              <li>
                <strong>Prisma Data, Inc.</strong> (Prisma Postgres) –
                Speicherung der Datenbank mit den oben genannten Kunden- und
                Mitarbeiterdaten (Serverstandort Frankfurt/EU, siehe Ziff.
                6). Es gilt ebenfalls Prismas Standard-Auftragsverarbeitungs-
                vertrag, der über die Nutzungsbedingungen automatisch
                eingeschlossen ist.
              </li>
              <li>
                <strong>Microsoft (Teams)</strong> – Startklar sendet täglich
                automatisiert eine kurze Erinnerung an einen Teams-Kanal des
                Unternehmens. Übermittelt wird ausschließlich eine Anzahl
                fälliger Vorgänge (z. B. „3 Kunden warten heute auf euch"),
                keine Namen, Kontaktdaten oder sonstigen personenbezogenen
                Kundendaten. Da hier bereits ein Microsoft-365-Vertrag des
                Unternehmens besteht, ist die Auftragsverarbeitung darüber
                mitabgedeckt.
              </li>
            </ul>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              <em>
                Bitte fachlich prüfen: Für Vercel und Prisma wurden bislang
                keine gesondert unterschriebenen DPA-Dokumente abgelegt,
                sondern nur deren automatisch geltende Standardverträge
                genutzt. Falls die Kanzlei eine explizit gegengezeichnete
                Fassung für die Unterlagen wünscht, können beide über die
                jeweiligen Account-Einstellungen angefordert werden.
              </em>
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">
              6. Serverstandort und Übermittlung in Staaten außerhalb der
              EU/des EWR
            </h2>
            <p>
              Sowohl die Datenbank (Prisma Postgres, Region{" "}
              <strong>eu-central-1, Frankfurt am Main</strong>) als auch die
              Anwendung selbst (Vercel Functions, seit 03.08.2026 fest auf
              Region <strong>eu-central-1 (fra1), Frankfurt am Main</strong>{" "}
              eingestellt) werden innerhalb der EU betrieben. Die eigentliche
              Datenverarbeitung findet somit in Deutschland/der EU statt.
            </p>
            <p className="mt-2">
              Sowohl Vercel Inc. als auch Prisma Data, Inc. sind
              US-Unternehmen. Auch bei Ausführung in einer EU-Region kann ein
              Restrisiko bestehen, dass z. B. Metadaten, Logs oder
              Support-Zugriffe über die globale Infrastruktur dieser Anbieter
              laufen. Mit beiden Anbietern gelten deren Standard-
              Auftragsverarbeitungsverträge (siehe Ziff. 5); soweit dabei
              ausnahmsweise ein Bezug in die USA entstehen sollte, stützen
              sich beide Anbieter nach eigenen Angaben auf die
              EU-Standardvertragsklauseln.
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">7. Speicherdauer</h2>
            <p>
              Kunden- und Vorgangsdaten werden gespeichert, solange sie für
              die Bearbeitung der jeweiligen Anfrage bzw. Buchung sowie für
              die interne Nachverfolgung benötigt werden. Abgeschlossene
              Vorgänge werden nach 60 Tagen automatisch archiviert.
              Mitarbeiter- und Sitzungsdaten werden gespeichert, solange die
              Person bei TCE-Reisen beschäftigt ist bzw. bis zum Ablauf der
              jeweiligen Anmeldesitzung. Gesetzliche Aufbewahrungspflichten
              (z. B. handels- oder steuerrechtlich) bleiben unberührt.
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">8. Ihre Rechte</h2>
            <p>
              Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung
              (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der
              Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20
              DSGVO) sowie Widerspruch gegen die Verarbeitung (Art. 21 DSGVO).
              Wenden Sie sich hierzu an die oben unter Ziff. 1 genannte
              Kontaktadresse.
            </p>
          </section>

          <section>
            <h2 className="font-bold mb-1">
              9. Beschwerderecht bei der Aufsichtsbehörde
            </h2>
            <p>
              Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde
              über die Verarbeitung Ihrer personenbezogenen Daten zu
              beschweren. Zuständig ist:
            </p>
            <p className="mt-2">
              Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)
              <br />
              Promenade 27
              <br />
              91522 Ansbach
              <br />
              Telefon: 0981 180093-0
              <br />
              E-Mail: poststelle@lda.bayern.de
            </p>
          </section>

          <section className="border-t border-[var(--color-border)] pt-4">
            <p className="text-sm text-[var(--color-muted)]">
              Hinweis: Dies ist eine technisch erstellte Fassung, keine
              rechtliche Prüfung. Vor der Nutzung bitte durch eine
              Rechtsanwaltskanzlei oder Datenschutzbeauftragte prüfen lassen
              – insbesondere Abschnitt 6 (Drittlandtransfer).
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
