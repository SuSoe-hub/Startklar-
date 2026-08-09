// Versand über die Microsoft-Graph-API (App-Registrierung "Startklar
// E-Mail-Versand" in Entra ID, Anwendungsberechtigung Mail.Send). Nutzt das
// bestehende Microsoft-365-Konto des Unternehmens, statt einen neuen
// Drittanbieter für den E-Mail-Versand einzubinden (siehe /datenschutz).

async function holeZugriffstoken(): Promise<string> {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("MS_GRAPH_TENANT_ID/CLIENT_ID/CLIENT_SECRET nicht gesetzt.");
  }

  const antwort = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );

  if (!antwort.ok) {
    const fehlertext = await antwort.text();
    throw new Error(`Token-Anfrage an Microsoft fehlgeschlagen: ${fehlertext}`);
  }

  const daten = (await antwort.json()) as { access_token: string };
  return daten.access_token;
}

export async function sendeMail({
  von,
  an,
  betreff,
  text,
}: {
  von: string;
  an: string;
  betreff: string;
  text: string;
}): Promise<void> {
  const token = await holeZugriffstoken();

  const antwort = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(von)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: betreff,
          body: { contentType: "Text", content: text },
          toRecipients: [{ emailAddress: { address: an } }],
        },
      }),
    }
  );

  if (!antwort.ok) {
    const fehlertext = await antwort.text();
    throw new Error(`Microsoft-Graph sendMail fehlgeschlagen: ${fehlertext}`);
  }
}
