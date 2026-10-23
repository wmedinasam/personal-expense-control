import Link from "next/link";
import { AuditStamp } from "@/app/_components/AuditStamp";
import CategoryIcon from "@/app/categorias/CategoryIcon";
import { prisma } from "@/lib/db";
import {
  formatAmount,
  formatDate,
  formatDateInput,
  formatMoney,
  getExpense,
  listExpenses,
  parseFilters,
  sumExpenses,
} from "@/lib/expenses";
import { getSettings } from "@/lib/settings";
import DeleteExpenseButton from "./DeleteExpenseButton";
import ExpenseForm from "./ExpenseForm";

export const metadata = { title: "Gastos" };

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

const fieldClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const desde = single(params.desde);
  const hasta = single(params.hasta);
  const categoria = single(params.categoria);
  const editarId = single(params.editar);

  const filters = parseFilters({
    from: desde,
    to: hasta,
    categoryId: categoria,
  });

  const settings = await getSettings();
  const [categories, expenses, summary, editing] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    listExpenses(filters),
    sumExpenses(filters, settings),
    editarId ? getExpense(editarId) : Promise.resolve(null),
  ]);
  const nombreMonedaTotal =
    settings.defaultCurrency === "GTQ" ? "quetzales" : "dólares";

  // Parámetros de filtro conservados en los enlaces de edición y cancelación.
  const filterParams = new URLSearchParams();
  if (desde) filterParams.set("desde", desde);
  if (hasta) filterParams.set("hasta", hasta);
  if (categoria) filterParams.set("categoria", categoria);
  const listHref = filterParams.toString()
    ? `/gastos?${filterParams.toString()}`
    : "/gastos";
  const editHref = (id: string) => {
    const query = new URLSearchParams(filterParams);
    query.set("editar", id);
    return `/gastos?${query.toString()}`;
  };

  const rangoInvalido =
    filters.from !== undefined &&
    filters.to !== undefined &&
    filters.from.getTime() > filters.to.getTime();
  const hayFiltros = Boolean(desde || hasta || categoria);
  const editingExpense = editing
    ? {
        id: editing.id,
        amount: editing.amount.toFixed(2),
        currency: editing.currency,
        date: formatDateInput(editing.date),
        categoryId: editing.categoryId,
        description: editing.description ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 text-neutral-900 dark:text-neutral-100">
      <header>
        <h1 className="text-2xl font-semibold">Gastos</h1>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-base font-semibold">
          {editingExpense ? "Editar gasto" : "Nuevo gasto"}
        </h2>
        {editarId && !editing && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            El gasto que intentas editar no existe.
          </p>
        )}
        {categories.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No hay categorías. Crea al menos una antes de registrar gastos.
          </p>
        ) : (
          <ExpenseForm
            key={editingExpense?.id ?? "nuevo"}
            categories={categories}
            defaultCurrency={settings.defaultCurrency}
            defaultDate={formatDateInput(new Date())}
            cancelHref={listHref}
            expense={editingExpense}
          />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <form
          method="get"
          action="/gastos"
          className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="desde" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Desde
            </label>
            <input
              id="desde"
              name="desde"
              type="date"
              defaultValue={desde}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hasta" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Hasta
            </label>
            <input
              id="hasta"
              name="hasta"
              type="date"
              defaultValue={hasta}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="categoria" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Categoría
            </label>
            <select
              id="categoria"
              name="categoria"
              defaultValue={categoria}
              className={fieldClass}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Aplicar
            </button>
            {hayFiltros && (
              <Link
                href="/gastos"
                className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>

        {rangoInvalido && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            La fecha &quot;Desde&quot; es posterior a &quot;Hasta&quot;, por lo que no hay resultados.
          </p>
        )}

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {summary.count} {summary.count === 1 ? "gasto" : "gastos"}
          </p>
          <div className="text-right text-sm">
            <p>
              Total en {nombreMonedaTotal}:{" "}
              <span className="text-lg font-semibold tabular-nums">
                {formatMoney(summary.total, summary.currency)}
              </span>
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tipo de cambio: 1 USD = {formatAmount(settings.usdToGtq)} Q
            </p>
          </div>
        </div>

        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            No hay gastos para este filtro.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
              >
                <time
                  dateTime={formatDateInput(expense.date)}
                  className="w-24 shrink-0 text-sm tabular-nums text-neutral-500 dark:text-neutral-400"
                >
                  {formatDate(expense.date)}
                </time>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CategoryIcon icon={expense.category.icon} color={expense.category.color} />
                    {expense.category.name}
                  </div>
                  <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">
                    {expense.description || "Sin descripción"}
                  </p>
                  <AuditStamp record={expense} />
                </div>
                <div className="text-sm font-medium tabular-nums">
                  {formatMoney(expense.amount, expense.currency)}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Link
                    href={editHref(expense.id)}
                    className="text-neutral-700 hover:underline dark:text-neutral-300"
                  >
                    Editar
                  </Link>
                  <DeleteExpenseButton id={expense.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
