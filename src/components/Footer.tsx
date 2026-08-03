import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto py-4 px-6 text-center text-sm text-[var(--color-muted)]">
      <Link href="/datenschutz" className="link">
        Datenschutz
      </Link>
      <span className="mx-2">·</span>
      <Link href="/impressum" className="link">
        Impressum
      </Link>
    </footer>
  );
}
