import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import SidebarNav from "@/components/SidebarNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mitarbeiter = await getAktuellerMitarbeiter();
  if (!mitarbeiter) redirect("/login");

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 hidden md:flex flex-col gap-1 bg-white border-r border-[var(--color-border)] p-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-extrabold text-[var(--color-primary-700)] px-2 py-3 mb-2"
        >
          <Image
            src="/logo.png"
            alt="TCE Reisen"
            width={300}
            height={153}
            className="h-10 w-auto"
            priority
          />
          <span>Startklar</span>
        </Link>

        <SidebarNav />

        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-[var(--color-border)]">
          <span className="px-2 text-sm font-bold text-[var(--color-muted)]">
            {mitarbeiter.name}
          </span>
          <form action={logout}>
            <button type="submit" className="btn-secondary w-full">
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 z-10 flex items-center gap-3 bg-white border-b border-[var(--color-border)] px-4 py-3">
        <Image
          src="/logo.png"
          alt="TCE Reisen"
          width={300}
          height={153}
          className="h-8 w-auto"
          priority
        />
        <span className="font-extrabold text-[var(--color-primary-700)]">
          Startklar
        </span>
        <Link href="/kunden" className="ml-auto text-sm link">
          Kunden
        </Link>
        <Link href="/einstellungen" className="text-sm link">
          Einstellungen
        </Link>
        <form action={logout}>
          <button type="submit" className="text-sm link">
            Abmelden
          </button>
        </form>
      </div>

      <div className="flex-1 min-w-0 pt-14 md:pt-0">{children}</div>
    </div>
  );
}
