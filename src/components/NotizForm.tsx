"use client";

import { useActionState, useRef } from "react";
import { addNotiz, type NotizFormState } from "@/lib/actions";
import EmojiLeiste from "./EmojiLeiste";

const initialState: NotizFormState = { error: null };

export default function NotizForm({ vorgangId }: { vorgangId: string }) {
  const action = addNotiz.bind(null, vorgangId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function smileyEinfuegen(emoji: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + emoji + el.value.slice(end);
    const cursor = start + emoji.length;
    el.selectionStart = el.selectionEnd = cursor;
    el.focus();
  }

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
        ref={textareaRef}
        name="text"
        rows={2}
        placeholder="Neue Notiz…"
        className="input"
      />
      <EmojiLeiste onSelect={smileyEinfuegen} />
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
