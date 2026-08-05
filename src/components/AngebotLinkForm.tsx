"use client";

import { useActionState } from "react";
import { updateAngebotLink, type AngebotLinkFormState } from "@/lib/actions";

const initialState: AngebotLinkFormState = { error: null };

export default function AngebotLinkForm({
  vorgangId,
  angebotLink,
}: {
  vorgangId: string;
  angebotLink: string | null;
}) {
  const action = updateAngebotLink.bind(null, vorgangId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-col gap-2">
      {angebotLink && (
        <a
          href={angebotLink}
          target="_blank"
          rel="noopener noreferrer"
          className="link text-sm break-all"
        >
          {angebotLink}
        </a>
      )}
      <form action={formAction} className="flex items-end gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="angebotLink" className="text-sm font-semibold">
            Angebotslink {angebotLink ? "ändern" : "hinterlegen"}
          </label>
          <input
            id="angebotLink"
            name="angebotLink"
            type="text"
            defaultValue={angebotLink ?? ""}
            placeholder="z. B. https://www.meinereiseangebote.de/..."
            className="input text-sm"
          />
        </div>
        <button type="submit" disabled={pending} className="btn-secondary shrink-0">
          {pending ? "…" : "Speichern"}
        </button>
      </form>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
