"use client";

import { useActionState } from "react";
import { siteLogin, type SiteGateFormState } from "@/lib/site-gate-actions";

const initialState: SiteGateFormState = { error: null };

export default function SiteGateForm({ ziel }: { ziel: string }) {
  const action = siteLogin.bind(null, ziel);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="passwort" className="text-sm font-semibold">
          Zugangspasswort
        </label>
        <input
          id="passwort"
          name="passwort"
          type="password"
          autoFocus
          required
          autoComplete="off"
          className="input"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "…" : "Weiter"}
      </button>
    </form>
  );
}
