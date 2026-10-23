import { Currency } from "@prisma/client";
import { getSettingsWithAudit } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { CURRENCY_LABEL } from "@/lib/currency";
import { AuditStamp } from "@/app/_components/AuditStamp";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [settings, user] = await Promise.all([getSettingsWithAudit(), getCurrentUser()]);
  const isAdmin = user?.role === "ADMIN";
  // La fila se crea sola con valores por defecto: sin updatedById nadie la ha modificado aún.
  const stamp = settings.updatedById ? <AuditStamp record={settings} /> : null;

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="mb-6 text-2xl font-semibold">Configuración</h1>
        <p className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Solo un administrador puede cambiar la configuración.
        </p>
        <dl className="space-y-4 rounded-lg border p-6">
          <div>
            <dt className="text-sm font-medium">Moneda por defecto</dt>
            <dd>{CURRENCY_LABEL[settings.defaultCurrency]}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Tipo de cambio (Q por $1)</dt>
            <dd>{settings.usdToGtq.toString()}</dd>
          </div>
        </dl>
        <div className="mt-2">{stamp}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Configuración</h1>

      <form action={updateSettings} className="space-y-5 rounded-lg border p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Moneda por defecto</span>
          <select
            name="defaultCurrency"
            defaultValue={settings.defaultCurrency}
            className="w-full rounded border px-3 py-2"
          >
            {Object.values(Currency).map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo de cambio (Q por $1)</span>
          <input
            name="usdToGtq"
            type="number"
            step="0.0001"
            min="0.0001"
            required
            defaultValue={settings.usdToGtq.toString()}
            className="w-full rounded border px-3 py-2"
          />
        </label>

        <button type="submit" className="rounded bg-black dark:bg-white px-4 py-2 text-white dark:text-neutral-950">
          Guardar
        </button>
      </form>
      <div className="mt-2">{stamp}</div>
    </main>
  );
}
