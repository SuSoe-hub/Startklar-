import Image from "next/image";
import SiteGateForm from "@/components/SiteGateForm";

export default async function SiteLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/logo.png"
            alt="TCE Reisen"
            width={300}
            height={153}
            className="h-16 w-auto"
            priority
          />
          <h1 className="text-xl font-bold tracking-tight">Startklar</h1>
        </div>
        <p className="text-sm text-[var(--color-muted)] text-center mb-4">
          Diese Seite ist geschützt. Bitte gib das Zugangspasswort ein.
        </p>
        <SiteGateForm ziel={next && next.startsWith("/") ? next : "/"} />
      </div>
    </main>
  );
}
