import { listCategoriesWithUsage } from "@/lib/categories";
import CategoryForm from "./CategoryForm";
import CategoryRow from "./CategoryRow";

// Lee la base de datos en cada petición: no debe prerenderizarse en build.
export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await listCategoriesWithUsage();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Agrupa tus gastos por tipo. Cada categoría tiene un color para reconocerla de un vistazo.
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">Nueva categoría</h2>
          <CategoryForm />
        </section>

        <section className="mt-8">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Listado</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {categories.length} {categories.length === 1 ? "categoría" : "categorías"}
            </span>
          </div>

          {categories.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-neutral-900 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Todavía no hay categorías. Crea la primera con el formulario de arriba.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 px-4 shadow-sm">
              {categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
