"use client";

import { useActionState, useRef } from "react";
import { addNotiz, type NotizFormState } from "@/lib/actions";

const initialState: NotizFormState = { error: null };

export default function NotizForm({ vorgangId }: { vorgangId: string }) {
  const action = addNotiz.bind(null, vorgangId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2 max-w-md"
    >
      <textarea
        name="text"
        rows={2}
        placeholder="Neue Notiz…"
        className="input"
      />
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-secondary self-start">
        {pending ? "Speichern…" : "Notiz hinzufügen"}
      </button>
    </form>
  );
}
