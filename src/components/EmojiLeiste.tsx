"use client";

const SMILEYS = ["😊", "😟", "😤", "👍", "🎉", "❤️"];

export default function EmojiLeiste({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {SMILEYS.map((smiley) => (
        <button
          key={smiley}
          type="button"
          onClick={() => onSelect(smiley)}
          className="text-lg leading-none hover:scale-110 transition-transform"
          aria-label={`Smiley ${smiley} einfügen`}
        >
          {smiley}
        </button>
      ))}
    </div>
  );
}
