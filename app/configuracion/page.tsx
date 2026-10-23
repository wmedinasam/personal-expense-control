import { Currency } from "@prisma/client";
import { getSettings } from "@/lib/settings";
import { CURRENCY_LABEL } from "@/lib/currency";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const settings = await getSettings();

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

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Guardar
        </button>
      </form>
    </main>
  );
}
