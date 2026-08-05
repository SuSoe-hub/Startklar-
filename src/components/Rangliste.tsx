import type { RanglistenEintrag } from "@/lib/rangliste";

const MEDAILLE: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export default function Rangliste({
  eintraege,
  eigeneId,
  smileysAktiviert,
}: {
  eintraege: RanglistenEintrag[];
  eigeneId: string | null;
  smileysAktiviert: boolean;
}) {
  const monatsName = new Date().toLocaleDateString("de-DE", { month: "long" });

  return (
    <div className="card p-4 flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        Vorgänge im {monatsName} – Rangliste
      </h2>
      <ul className="flex flex-col gap-1.5">
        {eintraege.map((e, i) => (
          <li
            key={e.mitarbeiterId}
            className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 ${
              e.mitarbeiterId === eigeneId
                ? "bg-[var(--color-primary-50)] font-semibold"
                : ""
            }`}
          >
            <span className="w-6 shrink-0 text-[var(--color-muted)]">
              {smileysAktiviert && MEDAILLE[i] && e.anzahl > 0
                ? MEDAILLE[i]
                : `${i + 1}.`}
            </span>
            <span className="flex-1">{e.name}</span>
            <span className="text-[var(--color-muted)]">{e.anzahl}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
