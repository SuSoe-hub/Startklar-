"use client";

import { useActionState } from "react";
import { removeVeranstalter, type VeranstalterFormState } from "@/lib/actions";

const initialState: VeranstalterFormState = { error: null };

export default function VeranstalterZeile({
  veranstalterId,
  code,
}: {
  veranstalterId: string;
  code: string;
}) {
  const action = removeVeranstalter.bind(null, veranstalterId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <li className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{code}</span>
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="text-xs text-[var(--color-muted)] underline hover:text-red-600"
          >
            {pending ? "…" : "Entfernen"}
          </button>
        </form>
      </div>
      {state.error && (
        <p className="text-xs text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </li>
  );
}
