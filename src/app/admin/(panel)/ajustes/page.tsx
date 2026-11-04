import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { saveSettings } from "@/lib/actions/admin";
import { SETTINGS_COLUMNS, mergeSettings, type SettingsRow } from "@/lib/settings";
import { siteConfig } from "@/config/site";
import { DAY_NAMES } from "@/lib/schedule";
import { AdminHeader, Card } from "@/components/admin/ui";
import { ActionForm, Checkbox, GroupError, Input, Textarea, adminControl } from "@/components/admin/form";

export const metadata: Metadata = { title: "Ajustes" };

// Lunes primero, domingo al final.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("settings").select(SETTINGS_COLUMNS).eq("id", 1).maybeSingle();
  const cfg = data ? mergeSettings(data as SettingsRow) : siteConfig;

  return (
    <>
      <AdminHeader
        title="Ajustes"
        description="Datos del negocio que se muestran en la web. Los cambios se aplican al momento."
      />
      <ActionForm action={saveSettings} submitLabel="Guardar ajustes" className="max-w-4xl">
        <Card title="Contacto">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="email"
              label="Email (Gmail)"
              type="email"
              defaultValue={cfg.email ?? ""}
              hint="Se muestra en la web y recibe los avisos de pedidos, solicitudes y mensajes."
            />
            <Input
              name="phoneDisplay"
              label="Teléfono (como se muestra)"
              defaultValue={cfg.phoneDisplay}
              required
            />
            <Input
              name="whatsappNumber"
              label="Número de WhatsApp"
              inputMode="numeric"
              defaultValue={cfg.whatsappNumber}
              hint="Con 58 delante y sin el 0: 584127408970."
              required
            />
            <Input name="instagramUrl" label="Instagram" type="url" defaultValue={cfg.instagram} required />
          </div>
        </Card>

        <Card title="Dirección">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input name="addressStreet" label="Calle" defaultValue={cfg.address.street} required />
            <Input name="addressBetween" label="Entre…" defaultValue={cfg.address.between} required />
            <Input
              name="addressSecondStreet"
              label="Segunda calle"
              defaultValue={cfg.address.secondStreet ?? ""}
              hint="Mientras esté vacía, la web muestra [PENDIENTE]."
            />
          </div>
        </Card>

        <Card title="Horario (hora de Caracas)">
          <div className="flex flex-col gap-3">
            {DAY_ORDER.map((day) => {
              const h = cfg.schedule[day];
              return (
                <fieldset
                  key={day}
                  className="grid grid-cols-[6.5rem_1fr_1fr] items-center gap-3 sm:grid-cols-[8rem_9rem_9rem_auto]"
                >
                  <legend className="sr-only">{DAY_NAMES[day]}</legend>
                  <span className="font-semibold" aria-hidden="true">
                    {DAY_NAMES[day]}
                  </span>
                  <label className="sr-only" htmlFor={`open-${day}`}>
                    {DAY_NAMES[day]}: abre
                  </label>
                  <input
                    id={`open-${day}`}
                    name={`open-${day}`}
                    type="time"
                    defaultValue={h?.open ?? "08:00"}
                    className={`${adminControl} min-h-12`}
                  />
                  <label className="sr-only" htmlFor={`close-${day}`}>
                    {DAY_NAMES[day]}: cierra
                  </label>
                  <input
                    id={`close-${day}`}
                    name={`close-${day}`}
                    type="time"
                    defaultValue={h?.close ?? "17:00"}
                    className={`${adminControl} min-h-12`}
                  />
                  <label className="col-span-3 flex min-h-11 items-center gap-2 sm:col-span-1">
                    <input
                      type="checkbox"
                      name={`closed-${day}`}
                      defaultChecked={!h}
                      className="size-5 accent-brand"
                    />
                    Cerrado
                  </label>
                </fieldset>
              );
            })}
            <GroupError name="schedule" />
          </div>
        </Card>

        <Card title="Garantía, costes y pagos">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="warrantyDuration"
              label="Duración de la garantía de reparaciones"
              defaultValue={cfg.warrantyDuration ?? ""}
              placeholder="Ej.: 3 meses"
              hint="Vacío = la web muestra [PENDIENTE]."
            />
            <Input
              name="orderExpirationHours"
              label="Horas para pagar un pedido"
              type="number"
              min={1}
              max={720}
              defaultValue={cfg.orderExpirationHours}
              hint="Pasado ese plazo sin pagar, el pedido se cancela y el stock se libera."
              required
            />
            <Input
              name="pickupCostNote"
              label="Coste orientativo de recogida"
              defaultValue={cfg.pickupCostNote ?? ""}
              placeholder="Ej.: desde 5 USD dentro de Caracas"
            />
            <Input
              name="returnShippingCostNote"
              label="Coste orientativo del envío de vuelta"
              defaultValue={cfg.returnShippingCostNote ?? ""}
              placeholder="Ej.: según la agencia, a cargo del cliente"
            />
            <Textarea
              name="paymentMethods"
              label="Métodos de pago aceptados"
              rows={3}
              defaultValue={cfg.paymentMethods.join("\n")}
              hint="Uno por línea."
              className="sm:col-span-2"
            />
          </div>
        </Card>

        <Card title="Inicio">
          <Checkbox
            name="showTestimonials"
            label="Mostrar la sección de reseñas"
            hint="Actívala solo cuando haya reseñas reales en src/content/home.ts."
            defaultChecked={cfg.showTestimonials}
          />
        </Card>
      </ActionForm>
    </>
  );
}
