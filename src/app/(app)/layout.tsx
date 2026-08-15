import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAktuellerMitarbeiter } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { ANWESENHEIT_GEFRAGT_COOKIE, heutigesDatumString } from "@/lib/teampool";
import { zaehleGlockenAnzahl } from "@/lib/benachrichtigung";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import Glocke from "@/components/Glocke";
import { GlockeProvider } from "@/components/GlockeProvider";
import AnwesenheitsPflichtfrage from "@/components/AnwesenheitsPflichtfrage";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mitarbeiter = await getAktuellerMitarbeiter();
  if (!mitarbeiter) redirect("/login");

  const heute = heutigesDatumString(new Date());
  const [anwesenheitHeute, cookieStore] = await Promise.all([
    prisma.anwesenheit.findUnique({
      where: {
        datum_mitarbeiterId: { datum: heute, mitarbeiterId: mitarbeiter.id },
      },
    }),
    cookies(),
  ]);
  const bereitsBeantwortet =
    !!anwesenheitHeute ||
    cookieStore.get(ANWESENHEIT_GEFRAGT_COOKIE)?.value === heute;

  if (!bereitsBeantwortet) {
    return <AnwesenheitsPflichtfrage mitarbeiter={mitarbeiter} />;
  }

  const ungeleseneAnzahl = await zaehleGlockenAnzahl(
    mitarbeiter.id,
    mitarbeiter.benachrichtigungenGelesenAm
  );

  return (
    <GlockeProvider initialAnzahl={ungeleseneAnzahl}>
      <div className="min-h-screen flex">
        <aside className="w-64 shrink-0 hidden md:flex flex-col gap-1 bg-white border-r border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between px-2 py-3 mb-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-extrabold text-[var(--color-primary-700)]"
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
            <Glocke menuAlign="left" />
          </div>

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
          <div className="ml-auto flex items-center gap-1">
            <Glocke />
            <MobileNav mitarbeiterName={mitarbeiter.name} />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-14 md:pt-0">{children}</div>
      </div>
    </GlockeProvider>
  );
}
