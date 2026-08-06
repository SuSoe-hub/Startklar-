"use client";

import { useState } from "react";

export default function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [status, setStatus] = useState<"idle" | "kopiert" | "fehler">("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setStatus("kopiert");
    } catch {
      setStatus("fehler");
    }
    setTimeout(() => setStatus("idle"), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${label} kopieren`}
      aria-label={`${label} kopieren`}
      className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary-600)] underline underline-offset-2 shrink-0"
    >
      {status === "kopiert"
        ? "Kopiert ✓"
        : status === "fehler"
          ? "Fehler beim Kopieren"
          : "Kopieren"}
    </button>
  );
}
