import KundeForm from "@/components/KundeForm";

export default function NeuerKundePage() {
  return (
    <main className="p-6 md:p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold tracking-tight mb-5">
        Neuen Kunden anlegen
      </h1>
      <KundeForm />
    </main>
  );
}
