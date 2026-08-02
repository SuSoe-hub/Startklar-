"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AnerkennungToast from "@/components/AnerkennungToast";

// Für Aktionen, die weiterleiten (z. B. neuen Vorgang anlegen): die Nachricht
// kommt als Query-Parameter mit, wird einmal angezeigt und die Adresse danach
// sofort wieder bereinigt, damit sie bei einem Neuladen nicht erneut auftaucht.
export default function AnerkennungFlash({ text }: { text: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AnerkennungToast text={text} />;
}
