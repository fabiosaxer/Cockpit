import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteItem, updateItem } from "@/app/actions";
import { ItemForm } from "@/components/ItemForm";
import { SubmitButton } from "@/components/SubmitButton";
import { loadCockpit, loadItem } from "@/lib/data";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id } = await params;
  const { back: rawBack } = await searchParams;
  const back = rawBack && rawBack.startsWith("/") && !rawBack.startsWith("//") ? rawBack : "/";

  const [item, { areas, types, projects, today }] = await Promise.all([loadItem(id), loadCockpit()]);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href={back} className="font-bold text-white">‹ Zurück</Link>
      <section className="instrument p-5 pt-4">
        <h1 className="mb-4 px-1 text-lg font-black">✏️ Eintrag bearbeiten</h1>
        <ItemForm
          areas={areas}
          types={types}
          projects={projects}
          today={today}
          item={item}
          action={updateItem.bind(null, item.id)}
          submitLabel="Speichern"
          back={back}
        />
        <form action={deleteItem.bind(null, item.id)} className="mt-3">
          <input type="hidden" name="back" value={back} />
          <SubmitButton className="btn btn-danger w-full">Löschen</SubmitButton>
        </form>
      </section>
    </div>
  );
}
