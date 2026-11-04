"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { clearCart } from "@/lib/cart/store";
import { placeOrder } from "@/lib/actions/shop";
import { checkoutSchema, ORDER_DELIVERY, type OrderDelivery } from "@/lib/validation/forms";
import type { FieldErrors } from "@/lib/validation/common";
import { VENEZUELA_STATES } from "@/content/forms";
import { formatBs, formatUsd } from "@/lib/money";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { PendingTag } from "@/components/ui/primitives";
import {
  CheckboxField,
  FormAlert,
  Honeypot,
  RadioCards,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { focusFirstError, formValues, omitKey, validateWith } from "@/components/forms/form-helpers";
import { RateNoticeClient } from "./rate-notice-client";
import { useCartQuote } from "./use-cart-quote";

const ORDER = [
  "name",
  "idDoc",
  "phone",
  "email",
  "deliveryMethod",
  "state",
  "city",
  "address",
  "agency",
  "notes",
  "terms",
];

export function CheckoutForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { lines, quoted, loading, rate, totalUsd, totalBs, hasIssues, orderLines, refresh } = useCartQuote();
  const [delivery, setDelivery] = useState<OrderDelivery | "">("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [stockProblem, setStockProblem] = useState(false);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (!lines.length && !done) {
    return (
      <div className="rounded-(--radius-card) bg-surface p-10 text-center shadow-soft ring-1 ring-line">
        <h2 className="text-2xl font-bold">Tu carrito está vacío</h2>
        <ButtonLink href="/tienda" size="lg" className="mt-6">
          Ir a la tienda
        </ButtonLink>
      </div>
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const clientErrors = validateWith(checkoutSchema, formValues(form));
    setErrors(clientErrors);
    setStockProblem(false);
    if (Object.keys(clientErrors).length) {
      setFormError("Revisa los campos marcados en rojo.");
      focusFirstError(form, clientErrors, ORDER);
      return;
    }
    if (hasIssues || !orderLines.length) {
      setFormError("Hay productos no disponibles en tu carrito. Revísalo antes de continuar.");
      return;
    }
    setFormError(undefined);
    const data = new FormData(form);
    startTransition(async () => {
      try {
        const result = await placeOrder(data, JSON.stringify(orderLines));
        if (result.status === "success") {
          setDone(true);
          clearCart();
          router.push(`/pedido/${result.token}`);
          return;
        }
        setFormError(result.message);
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
          requestAnimationFrame(() => focusFirstError(formRef.current, result.fieldErrors!, ORDER));
        }
        if (result.stockIssues) {
          setStockProblem(true);
          refresh();
        }
      } catch {
        setFormError("No pudimos enviar tu pedido. Revisa tu conexión e inténtalo de nuevo.");
      }
    });
  }

  const shipping = delivery === "national_shipping";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-10">
      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        onInput={(e) => {
          const name = (e.target as HTMLInputElement).name;
          if (name && errors[name]) setErrors((prev) => omitKey(prev, name));
        }}
        aria-labelledby="checkout-title"
        className="relative grid gap-8 rounded-(--radius-card) bg-surface p-6 shadow-soft ring-1 ring-line sm:p-9"
      >
        <Honeypot />
        <h2 id="checkout-title" className="sr-only">
          Datos del pedido
        </h2>

        {formError && (
          <FormAlert>
            {formError}
            {stockProblem && (
              <>
                {" "}
                <Link href="/carrito" className="underline underline-offset-4">
                  Revisar el carrito
                </Link>
              </>
            )}
          </FormAlert>
        )}

        <fieldset className="grid gap-6">
          <legend className="mb-2 text-xl font-bold">1. Tus datos</legend>
          <TextField
            name="name"
            label="Nombre y apellido"
            autoComplete="name"
            maxLength={100}
            error={errors.name}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField
              name="idDoc"
              label="Cédula o RIF"
              placeholder="V-12345678"
              autoComplete="off"
              maxLength={20}
              hint="La necesitamos para emitir la factura."
              error={errors.idDoc}
            />
            <TextField
              name="phone"
              label="Teléfono (WhatsApp)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0412-1234567"
              maxLength={25}
              error={errors.phone}
            />
          </div>
          <TextField
            name="email"
            label="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            hint="Te enviaremos aquí la confirmación y, si lo prefieres, el enlace de cobro."
            error={errors.email}
          />
        </fieldset>

        <fieldset className="grid gap-6">
          <legend className="mb-2 text-xl font-bold">2. Entrega</legend>
          <div
            onChange={(e) => {
              const t = e.target as HTMLInputElement;
              if (t.name === "deliveryMethod") setDelivery(t.value as OrderDelivery);
            }}
          >
            <RadioCards
              name="deliveryMethod"
              legend="¿Cómo quieres recibir tu pedido?"
              error={errors.deliveryMethod}
              columns={2}
              options={(Object.keys(ORDER_DELIVERY) as OrderDelivery[]).map((k) => ({
                value: k,
                label: ORDER_DELIVERY[k].label,
                description: ORDER_DELIVERY[k].description,
              }))}
            />
          </div>
          {shipping && (
            <div className="grid gap-6 rounded-2xl bg-sand/50 p-5 ring-1 ring-line">
              <div className="grid gap-6 sm:grid-cols-2">
                <SelectField name="state" label="Estado" options={VENEZUELA_STATES} error={errors.state} />
                <TextField
                  name="city"
                  label="Ciudad"
                  autoComplete="address-level2"
                  maxLength={80}
                  error={errors.city}
                />
              </div>
              <TextField
                name="address"
                label="Dirección de entrega o de la oficina de la agencia"
                autoComplete="street-address"
                maxLength={300}
                error={errors.address}
              />
              <TextField
                name="agency"
                label="Agencia preferida"
                optional
                placeholder="Ej.: MRW, Zoom, Tealca…"
                maxLength={80}
                error={errors.agency}
              />
            </div>
          )}
          <TextAreaField name="notes" label="Notas" optional rows={3} maxLength={1000} error={errors.notes} />
        </fieldset>

        <div className="grid gap-5 border-t border-line pt-6">
          <div className="rounded-2xl bg-sand/60 p-4 text-[0.95rem] text-ink-soft">
            <strong className="text-ink">Aún no pagas nada.</strong> Al confirmar, apartamos los productos y
            te enviamos por WhatsApp o correo el enlace de cobro para completar tu compra.
          </div>
          <CheckboxField name="terms" error={errors.terms}>
            Acepto los{" "}
            <a
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-ink underline underline-offset-4"
            >
              términos y condiciones
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>{" "}
            y la{" "}
            <a
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-ink underline underline-offset-4"
            >
              política de privacidad
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
            .
          </CheckboxField>
          <button
            type="submit"
            className={buttonClasses("primary", "lg", "w-full sm:w-auto sm:justify-self-start")}
            disabled={pending || loading}
            aria-busy={pending}
          >
            {pending ? "Confirmando…" : "Confirmar pedido"}
          </button>
        </div>
      </form>

      <aside
        aria-labelledby="checkout-summary-title"
        className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start"
      >
        <div className="rounded-(--radius-card) bg-surface p-6 shadow-soft ring-1 ring-line">
          <h2 id="checkout-summary-title" className="text-xl font-bold">
            Tu pedido
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {quoted.map(({ line, product, quantity, unavailable }) => (
              <li key={line.slug} className="flex justify-between gap-3 py-3 text-[0.95rem]">
                <span className={unavailable ? "text-muted line-through" : ""}>
                  {quantity || line.quantity} × {product?.name ?? (loading ? "Cargando…" : "No disponible")}
                  {product?.isSample && (
                    <>
                      {" "}
                      <PendingTag>[EJEMPLO]</PendingTag>
                    </>
                  )}
                </span>
                {product && !unavailable && (
                  <span className="shrink-0 font-semibold">{formatUsd(product.priceUsd * quantity)}</span>
                )}
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-line pt-4">
            <div className="flex justify-between gap-4">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-2xl font-bold">{loading ? "…" : formatUsd(totalUsd)}</dd>
            </div>
            {totalBs !== null && (
              <div className="flex justify-between gap-4 text-sm">
                <dt className="text-muted">Referencia en Bs</dt>
                <dd className="font-semibold">{formatBs(totalBs)}</dd>
              </div>
            )}
          </dl>
          <Link
            href="/carrito"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-ink underline-offset-4 hover:underline"
          >
            Modificar carrito
          </Link>
        </div>
        <RateNoticeClient rate={rate} />
      </aside>
    </div>
  );
}
