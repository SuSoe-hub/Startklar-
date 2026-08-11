"use client";

import Image from "next/image";
import { useTransition } from "react";
import { markiereAnwesend, ueberspringeAnwesenheitsfrage } from "@/lib/actions";
import { logout } from "@/lib/auth-actions";

export default function AnwesenheitsPflichtfrage({
  mitarbeiter,
}: {
  mitarbeiter: { id: string; name: string };
}) {
  const [pending, startTransition] = useTransition();

  function jaDa() {
    startTransition(() => {
      markiereAnwesend(mitarbeiter.id);
    });
  }

  function neinNicht() {
    startTransition(() => {
      ueberspringeAnwesenheitsfrage();
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-sm w-full p-6 flex flex-col items-center gap-4 text-center">
        <Image
          src="/logo.png"
          alt="TCE Reisen"
          width={300}
          height={153}
          className="h-10 w-auto"
          priority
        />
        <div>
          <p className="text-lg font-bold">Hallo {mitarbeiter.name}!</p>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Bist du heute im Büro? So wissen wir, an wen fällige Vorgänge von
            abwesenden Kolleg:innen verteilt werden können.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={jaDa}
            disabled={pending}
            className="btn-primary w-full"
          >
            {pending ? "…" : "Ja, ich bin da"}
          </button>
          <button
            type="button"
            onClick={neinNicht}
            disabled={pending}
            className="btn-secondary w-full"
          >
            Nein, heute nicht da
          </button>
        </div>
        <form action={logout}>
          <button type="submit" className="text-xs link">
            Falscher Name? Abmelden
          </button>
        </form>
      </div>
    </div>
  );
}
