import { AuditStamp } from "@/app/_components/AuditStamp";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FormError,
  Input,
  Label,
  Select,
} from "@/app/_components/ui";
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 text-foreground">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
      </header>

      <Card>
        <h2 className="mb-4 text-base font-semibold">
          {editingExpense ? "Editar gasto" : "Nuevo gasto"}
        </h2>
        {editarId && !editing && (
          <div className="mb-4">
            <FormError>El gasto que intentas editar no existe.</FormError>
          </div>
        )}
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
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
      </Card>

      <section className="flex flex-col gap-4">
        <Card className="p-4">
          <form method="get" action="/gastos" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" name="desde" type="date" defaultValue={desde} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" name="hasta" type="date" defaultValue={hasta} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="categoria">Categoría</Label>
              <Select id="categoria" name="categoria" defaultValue={categoria}>
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary">
                Aplicar
              </Button>
              {hayFiltros && (
                <ButtonLink href="/gastos" variant="ghost">
                  Limpiar
                </ButtonLink>
              )}
            </div>
          </form>
        </Card>

        {rangoInvalido && (
          <FormError>
            La fecha &quot;Desde&quot; es posterior a &quot;Hasta&quot;, por lo que no hay resultados.
          </FormError>
        )}

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
          <p className="text-sm text-muted">
            {summary.count} {summary.count === 1 ? "gasto" : "gastos"}
          </p>
          <div className="text-right text-sm">
            <p>
              Total en {nombreMonedaTotal}:{" "}
              <span className="text-lg font-semibold tabular-nums">
                {formatMoney(summary.total, summary.currency)}
              </span>
            </p>
            <p className="text-xs text-muted">
              Tipo de cambio: 1 USD = {formatAmount(settings.usdToGtq)} Q
            </p>
          </div>
        </div>

        {expenses.length === 0 ? (
          <EmptyState>No hay gastos para este filtro.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
              >
                <time
                  dateTime={formatDateInput(expense.date)}
                  className="w-24 shrink-0 text-sm tabular-nums text-muted"
                >
                  {formatDate(expense.date)}
                </time>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CategoryIcon icon={expense.category.icon} color={expense.category.color} />
                    {expense.category.name}
                  </div>
                  <p className="truncate text-sm text-muted">
                    {expense.description || "Sin descripción"}
                  </p>
                  <AuditStamp record={expense} />
                </div>
                <div className="text-sm font-medium tabular-nums">
                  {formatMoney(expense.amount, expense.currency)}
                </div>
                <div className="flex items-center gap-2">
                  <ButtonLink href={editHref(expense.id)} variant="secondary">
                    Editar
                  </ButtonLink>
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
