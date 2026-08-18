"use client";

import { useActionState, useState } from "react";
import {
  trageLogoutNach,
  type AnwesenheitKorrekturState,
} from "@/lib/actions";

const initialState: AnwesenheitKorrekturState = { error: null };

export default function LogoutNachtragenForm({
  anwesenheitId,
}: {
  anwesenheitId: string;
}) {
  const action = trageLogoutNach.bind(null, anwesenheitId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [uhrzeit, setUhrzeit] = useState("");

  return (
    <form action={formAction} className="flex items-center gap-2 mt-1">
      <input
        name="uhrzeit"
        type="time"
        value={uhrzeit}
        onChange={(e) => setUhrzeit(e.target.value)}
        className="input text-xs py-1"
      />
      <button
        type="submit"
        disabled={pending || !uhrzeit}
        className="btn-secondary py-1 text-xs shrink-0"
      >
        {pending ? "…" : "Logout nachtragen"}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
