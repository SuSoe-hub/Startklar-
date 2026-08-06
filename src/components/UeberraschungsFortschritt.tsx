import {
  UEBERRASCHUNG_SCHWELLE,
  type UeberraschungsEintrag,
} from "@/lib/rangliste";

export default function UeberraschungsFortschritt({
  eintraege,
  eigeneId,
}: {
  eintraege: UeberraschungsEintrag[];
  eigeneId: string | null;
}) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        Fortschritt bis zur 50er-Überraschung
      </h2>
      <ul className="flex flex-col gap-2">
        {eintraege.map((e) => {
          const prozent = Math.min(
            100,
            Math.round((e.anzahlGesamt / UEBERRASCHUNG_SCHWELLE) * 100)
          );
          return (
            <li
              key={e.mitarbeiterId}
              className={`text-sm rounded-lg px-2 py-1.5 ${
                e.mitarbeiterId === eigeneId
                  ? "bg-[var(--color-primary-50)] font-semibold"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>{e.name}</span>
                <span className="text-[var(--color-muted)] font-normal">
                  {e.erreicht
                    ? "🎁 Überraschung erhalten"
                    : `${e.anzahlGesamt} / ${UEBERRASCHUNG_SCHWELLE}`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    e.erreicht
                      ? "bg-[var(--color-primary-400)]"
                      : "bg-[var(--color-primary-600)]"
                  }`}
                  style={{ width: `${prozent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
