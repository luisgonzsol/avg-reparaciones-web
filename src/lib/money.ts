/**
 * Dinero: el precio base siempre está en USD. El monto en Bs es
 * referencial y se calcula con la tasa del día.
 *
 * Para evitar errores de coma flotante se trabaja en céntimos (enteros).
 */

export type Currency = "USD" | "VES";

export const CURRENCY_COOKIE = "avg_currency";

export function isCurrency(value: unknown): value is Currency {
  return value === "USD" || value === "VES";
}

/** Convierte un importe decimal a céntimos enteros, redondeando. */
export function toCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Escala de la tasa: la base de datos la guarda como numeric(14,4). */
const RATE_SCALE = 10_000;

/**
 * USD → Bs con la tasa indicada, redondeado a 2 decimales (mitad hacia
 * arriba). Usa aritmética entera para dar EXACTAMENTE el mismo resultado
 * que Postgres (round(numeric, 2)): 19,50 × 236,45 = 4610,775 → 4610,78.
 */
export function usdToBs(usd: number, rate: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(rate) || rate <= 0 || usd < 0) {
    throw new RangeError("Importe o tasa no válidos");
  }
  const cents = BigInt(toCents(usd));
  const scaledRate = BigInt(Math.round(rate * RATE_SCALE));
  const scale = BigInt(RATE_SCALE);
  const bsCents = (cents * scaledRate + scale / BigInt(2)) / scale;
  return Number(bsCents) / 100;
}

export type LineItem = { priceUsd: number; quantity: number };

/** Subtotal en USD a partir de las líneas, sumando en céntimos. */
export function subtotalUsd(items: LineItem[]): number {
  const cents = items.reduce((sum, { priceUsd, quantity }) => {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError("Cantidad no válida");
    }
    return sum + toCents(priceUsd) * quantity;
  }, 0);
  return fromCents(cents);
}

const usdFormatter = new Intl.NumberFormat("es-VE", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const bsNumberFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(amount: number): string {
  return usdFormatter.format(amount);
}

/** Formato "Bs. 1.234,56" (es-VE). */
export function formatBs(amount: number): string {
  return `Bs. ${bsNumberFormatter.format(amount)}`;
}

export function formatRate(rate: number): string {
  return `${bsNumberFormatter.format(rate)} Bs/USD`;
}

export function formatPrice(usd: number, currency: Currency, rate: number): string {
  return currency === "USD" ? formatUsd(usd) : formatBs(usdToBs(usd, rate));
}
