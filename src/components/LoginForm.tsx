"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { login, type LoginFormState } from "@/lib/auth-actions";

const initialState: LoginFormState = { error: null };

type MitarbeiterOption = { id: string; name: string; hatPin: boolean };

export default function LoginForm({
  mitarbeiter,
}: {
  mitarbeiter: MitarbeiterOption[];
}) {
  const [ausgewaehlt, setAusgewaehlt] = useState<MitarbeiterOption | null>(
    null
  );

  if (!ausgewaehlt) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[var(--color-muted)] text-center mb-2">
          Wer bist du?
        </p>
        {mitarbeiter.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setAusgewaehlt(m)}
            className="card p-3 text-left hover:shadow-md transition-shadow font-semibold"
          >
            {m.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <PinSchritt
      key={ausgewaehlt.id}
      mitarbeiter={ausgewaehlt}
      onZurueck={() => setAusgewaehlt(null)}
    />
  );
}

function PinSchritt({
  mitarbeiter,
  onZurueck,
}: {
  mitarbeiter: MitarbeiterOption;
  onZurueck: () => void;
}) {
  const action = login.bind(null, mitarbeiter.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [pin, setPin] = useState("");

  // Chrome/Edge versuchen bei einem <input type="password"> gerne gespeicherte
  // Zugangsdaten einzufügen, was hier zu falschen/zusätzlichen Zeichen führen
  // kann. autoComplete="one-time-code" signalisiert dem Browser, dass es sich
  // um einen kurzen Einmalcode statt eines echten Passworts handelt. Zusätzlich
  // wird hart auf genau 4 Ziffern begrenzt, unabhängig davon, was eingefügt wird.
  const handlePinChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onZurueck}
        className="text-sm link self-start"
      >
        ← Nicht {mitarbeiter.name}?
      </button>
      <div className="flex flex-col gap-1">
        <label htmlFor="pin" className="text-sm font-semibold">
          {mitarbeiter.hatPin
            ? `PIN von ${mitarbeiter.name}`
            : `Neue PIN für ${mitarbeiter.name} festlegen`}
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          autoComplete="one-time-code"
          autoFocus
          required
          value={pin}
          onChange={handlePinChange}
          className="input text-center text-lg tracking-[0.5em]"
        />
        {!mitarbeiter.hatPin && (
          <p className="text-xs text-[var(--color-muted)]">
            4 Ziffern, merk sie dir gut – das ist ab jetzt deine PIN.
          </p>
        )}
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || pin.length !== 4}
        className="btn-primary"
      >
        {pending
          ? "…"
          : mitarbeiter.hatPin
          ? "Einloggen"
          : "PIN festlegen & einloggen"}
      </button>
    </form>
  );
}
