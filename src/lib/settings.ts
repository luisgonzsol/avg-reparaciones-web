import "server-only";
import { cache } from "react";
import { z } from "@/lib/zod";
import { siteConfig, type SiteConfig } from "@/config/site";
import { getPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { WeeklySchedule } from "@/lib/schedule";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const dayHours = z.object({ open: hhmm, close: hhmm }).nullable();
export const scheduleSchema = z.object({
  0: dayHours,
  1: dayHours,
  2: dayHours,
  3: dayHours,
  4: dayHours,
  5: dayHours,
  6: dayHours,
});

export type SettingsRow = {
  email: string | null;
  phone_display: string;
  whatsapp_number: string;
  address_street: string;
  address_between: string;
  address_second_street: string | null;
  instagram_url: string;
  schedule: unknown;
  warranty_duration: string | null;
  pickup_cost_note: string | null;
  return_shipping_cost_note: string | null;
  order_expiration_hours: number;
  payment_methods: string[];
  show_testimonials: boolean;
  updated_at: string;
};

export const SETTINGS_COLUMNS =
  "email, phone_display, whatsapp_number, address_street, address_between, address_second_street, instagram_url, schedule, warranty_duration, pickup_cost_note, return_shipping_cost_note, order_expiration_hours, payment_methods, show_testimonials, updated_at";

function instagramHandle(url: string): string {
  const m = url.match(/instagram\.com\/([A-Za-z0-9._]+)/);
  return m ? `@${m[1]}` : siteConfig.instagramHandle;
}

/** Combina la fila de `settings` con los valores por defecto del código. */
export function mergeSettings(row: SettingsRow, base: SiteConfig = siteConfig): SiteConfig {
  const schedule = scheduleSchema.safeParse(row.schedule);
  return {
    ...base,
    email: row.email || null,
    phoneDisplay: row.phone_display || base.phoneDisplay,
    whatsappNumber: row.whatsapp_number || base.whatsappNumber,
    phoneE164: row.whatsapp_number ? `+${row.whatsapp_number}` : base.phoneE164,
    instagram: row.instagram_url || base.instagram,
    instagramHandle: instagramHandle(row.instagram_url || base.instagram),
    address: {
      ...base.address,
      street: row.address_street || base.address.street,
      between: row.address_between || base.address.between,
      secondStreet: row.address_second_street || null,
    },
    schedule: schedule.success ? (schedule.data as WeeklySchedule) : base.schedule,
    warrantyDuration: row.warranty_duration || null,
    pickupCostNote: row.pickup_cost_note || null,
    returnShippingCostNote: row.return_shipping_cost_note || null,
    orderExpirationHours: row.order_expiration_hours || base.orderExpirationHours,
    paymentMethods: row.payment_methods?.length ? row.payment_methods : base.paymentMethods,
    showTestimonials: Boolean(row.show_testimonials),
  };
}

/**
 * Datos del negocio vigentes (una consulta por petición). Si Supabase no
 * está configurado o falla, devuelve los valores de `src/config/site.ts`.
 */
export const getSiteSettings = cache(async (): Promise<SiteConfig> => {
  if (!isSupabaseConfigured()) return siteConfig;
  try {
    const { data, error } = await getPublicClient()
      .from("settings")
      .select(SETTINGS_COLUMNS)
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mergeSettings(data as SettingsRow) : siteConfig;
  } catch (e) {
    console.error("[ajustes]", e instanceof Error ? e.message : e);
    return siteConfig;
  }
});
