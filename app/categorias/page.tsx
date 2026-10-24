import { listCategoriesWithUsage } from "@/lib/categories";
import { Card, EmptyState, PageShell } from "@/app/_components/ui";
import CategoryForm from "./CategoryForm";
import CategoryRow from "./CategoryRow";

// Lee la base de datos en cada petición: no debe prerenderizarse en build.
export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await listCategoriesWithUsage();

  return (
    <PageShell title="Categorías" width="xl">
      <p className="-mt-4 text-sm text-muted">
        Agrupa tus gastos por tipo. Cada categoría tiene un color para reconocerla de un vistazo.
      </p>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Nueva categoría</h2>
        <CategoryForm />
      </Card>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Listado</h2>
          <span className="text-sm text-muted">
            {categories.length} {categories.length === 1 ? "categoría" : "categorías"}
          </span>
        </div>

        {categories.length === 0 ? (
          <EmptyState>Todavía no hay categorías. Crea la primera con el formulario de arriba.</EmptyState>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface px-4">
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
