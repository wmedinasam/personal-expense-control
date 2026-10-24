import { Currency } from "@prisma/client";
import { getSettingsWithAudit } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { CURRENCY_LABEL } from "@/lib/currency";
import { AuditStamp } from "@/app/_components/AuditStamp";
import { Button, Card, Input, Label, PageShell, Select } from "@/app/_components/ui";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [settings, user] = await Promise.all([getSettingsWithAudit(), getCurrentUser()]);
  const isAdmin = user?.role === "ADMIN";
  // La fila se crea sola con valores por defecto: sin updatedById nadie la ha modificado aún.
  const stamp = settings.updatedById ? <AuditStamp record={settings} /> : null;

  if (!isAdmin) {
    return (
      <PageShell title="Configuración" width="xl">
        <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted">
          Solo un administrador puede cambiar la configuración.
        </p>
        <Card>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted">Moneda por defecto</dt>
              <dd className="text-foreground">{CURRENCY_LABEL[settings.defaultCurrency]}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted">Tipo de cambio (Q por $1)</dt>
              <dd className="text-foreground">{settings.usdToGtq.toString()}</dd>
            </div>
          </dl>
        </Card>
        {stamp}
      </PageShell>
    );
  }

  return (
    <PageShell title="Configuración" width="xl">
      <Card>
        <form action={updateSettings} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="defaultCurrency">Moneda por defecto</Label>
            <Select id="defaultCurrency" name="defaultCurrency" defaultValue={settings.defaultCurrency}>
              {Object.values(Currency).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABEL[c]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usdToGtq">Tipo de cambio (Q por $1)</Label>
            <Input
              id="usdToGtq"
              name="usdToGtq"
              type="number"
              step="0.0001"
              min="0.0001"
              required
              defaultValue={settings.usdToGtq.toString()}
            />
          </div>

          <div>
            <Button type="submit" variant="primary">
              Guardar
            </Button>
          </div>
        </form>
      </Card>
      {stamp}
    </PageShell>
  );
}
