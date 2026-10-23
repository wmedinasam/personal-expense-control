import Link from "next/link";
import {
  formatFormDate,
  getBudgetById,
  listBudgetViews,
  listCategories,
  todayUtcDate,
  type BudgetView,
} from "@/lib/budgets";
import { BudgetForm } from "./_components/budget-form";
import { DeleteBudgetButton } from "./_components/delete-budget-button";
import { getSettings } from "@/lib/settings";
import { formatDate, formatMoney } from "./format";

// Consulta la base de datos en cada petición: el consumo depende de la fecha de hoy.
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ editar?: string | string[] }>;
};

export default async function PresupuestosPage({ searchParams }: PageProps) {
  const { editar } = await searchParams;
  const editId = typeof editar === "string" ? editar : null;
  const today = todayUtcDate();

  const [settings, categories, editing] = await Promise.all([
    getSettings(),
    listCategories(),
    editId ? getBudgetById(editId) : Promise.resolve(null),
  ]);
  const budgets = await listBudgetViews(today, settings.usdToGtq);

  const formBudget = editing
    ? {
        id: editing.id,
        name: editing.name,
        amount: editing.amount.toFixed(2),
        currency: editing.currency,
        startDate: formatFormDate(editing.startDate),
        endDate: formatFormDate(editing.endDate),
        categoryIds: editing.categories.map((c) => c.id),
      }
    : undefined;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Presupuestos</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            El consumo se calcula con los gastos registrados entre las fechas del
            presupuesto y de sus categorías. Los gastos en otra moneda se convierten
            con el tipo de cambio de Configuración.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="lg:col-start-3 lg:row-start-1 lg:self-start lg:sticky lg:top-6">
            <BudgetForm
              key={formBudget?.id ?? "nuevo"}
              categories={categories}
              budget={formBudget}
              defaultCurrency={settings.defaultCurrency}
            />
          </aside>

          <section className="space-y-4 lg:col-span-2 lg:col-start-1 lg:row-start-1">
            {budgets.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-neutral-900 p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                Todavía no hay presupuestos. Crea el primero desde el formulario.
              </p>
            ) : (
              budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  isEditing={budget.id === editing?.id}
                />
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function BudgetCard({ budget, isEditing }: { budget: BudgetView; isEditing: boolean }) {
  const c = budget.consumption;
  const overBudget = c.remaining < 0;
  const barWidth = Math.min(c.percentUsed, 100);
  const barColor =
    c.percentUsed > 100
      ? "bg-red-600 dark:bg-red-400"
      : c.percentUsed >= 80
        ? "bg-amber-500 dark:bg-amber-400"
        : "bg-slate-700 dark:bg-slate-300";

  let timeLabel: string;
  if (c.remainingDays === 0) {
    timeLabel = "Periodo finalizado";
  } else if (c.elapsedDays === 0) {
    timeLabel = `Empieza el ${formatDate(budget.startDate)}`;
  } else {
    timeLabel = `Día ${c.elapsedDays} de ${c.totalDays}`;
  }

  return (
    <article
      className={`rounded-lg border bg-white dark:bg-neutral-900 p-5 ${
        isEditing ? "border-slate-900 dark:border-slate-100" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{budget.name}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(budget.startDate)} – {formatDate(budget.endDate)}
          </p>
          <p className="mt-1 flex flex-wrap gap-1 text-xs text-slate-600 dark:text-slate-400">
            {budget.categoryNames.length === 0 ? (
              <span className="rounded bg-slate-100 dark:bg-slate-900 px-2 py-0.5">Todas las categorías</span>
            ) : (
              budget.categoryNames.map((name) => (
                <span key={name} className="rounded bg-slate-100 dark:bg-slate-900 px-2 py-0.5">
                  {name}
                </span>
              ))
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href={`/presupuestos?editar=${budget.id}`}
            className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:underline"
          >
            Editar
          </Link>
          <DeleteBudgetButton id={budget.id} name={budget.name} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">
            {formatMoney(c.spent, budget.currency)}{" "}
            <span className="text-slate-500 dark:text-slate-400">de {formatMoney(budget.amount, budget.currency)}</span>
          </span>
          <span className="tabular-nums text-slate-600 dark:text-slate-400">{c.percentUsed.toFixed(0)}%</span>
        </div>
        <div
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(barWidth)}
          aria-label={`Consumo de ${budget.name}`}
        >
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Restante</dt>
          <dd className={`font-medium tabular-nums ${overBudget ? "text-red-600 dark:text-red-400" : ""}`}>
            {formatMoney(c.remaining, budget.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Ritmo diario sugerido</dt>
          <dd className="font-medium tabular-nums">
            {c.suggestedDailyPace === null
              ? "—"
              : `${formatMoney(c.suggestedDailyPace, budget.currency)} / día`}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Plazo</dt>
          <dd className="font-medium">{timeLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Días restantes</dt>
          <dd className="font-medium tabular-nums">{c.remainingDays}</dd>
        </div>
      </dl>

      {overBudget && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          Presupuesto superado en {formatMoney(-c.remaining, budget.currency)}.
        </p>
      )}
    </article>
  );
}
