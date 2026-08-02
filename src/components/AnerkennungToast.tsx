"use client";

import { useEffect, useState } from "react";

export default function AnerkennungToast({ text }: { text: string }) {
  const [sichtbar, setSichtbar] = useState(true);

  useEffect(() => {
    setSichtbar(true);
    const timer = setTimeout(() => setSichtbar(false), 4000);
    return () => clearTimeout(timer);
  }, [text]);

  if (!sichtbar) return null;

  return (
    <p className="text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mt-2">
      {text}
    </p>
  );
}
