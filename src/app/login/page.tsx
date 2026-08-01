import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const aktuell = await getAktuellerMitarbeiter();
  if (aktuell) redirect("/");

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image src="/logo.png" alt="TCE Reisen" width={300} height={153} className="h-16 w-auto" priority />
          <h1 className="text-xl font-bold tracking-tight">Startklar</h1>
        </div>
        <LoginForm
          mitarbeiter={mitarbeiter.map((m) => ({
            id: m.id,
            name: m.name,
            hatPin: !!m.pinHash,
          }))}
        />
      </div>
    </main>
  );
}
