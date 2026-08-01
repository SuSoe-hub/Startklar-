"use client";

import { useState, useTransition } from "react";
import { markiereAnwesend } from "@/lib/actions";

export default function WerIstHeuteDa({
  mitarbeiter,
}: {
  mitarbeiter: { id: string; name: string }[];
}) {
  const [, startTransition] = useTransition();
  const [angetippt, setAngetippt] = useState<Set<string>>(new Set());

  function antippen(id: string) {
    setAngetippt((s) => new Set(s).add(id));
    startTransition(() => {
      markiereAnwesend(id);
    });
  }

  return (
    <div className="card border-l-4 border-l-[var(--color-primary-400)] bg-[var(--color-primary-50)]/60 p-4">
      <p className="text-sm font-semibold mb-2">Wer ist heute da?</p>
      <div className="flex flex-wrap gap-2">
        {mitarbeiter.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => antippen(m.id)}
            disabled={angetippt.has(m.id)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              angetippt.has(m.id)
                ? "bg-green-100 border-green-400 text-green-700"
                : "bg-white border-[var(--color-border)] hover:bg-[var(--color-primary-50)]"
            }`}
          >
            {m.name}
            {angetippt.has(m.id) ? " ✓" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
