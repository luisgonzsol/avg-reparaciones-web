"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import clsx from "clsx";
import {
  COMMON_BRANDS,
  DELIVERY_METHODS,
  DELIVERY_METHOD_KEYS,
  EQUIPMENT_TYPES,
  VENEZUELA_STATES,
} from "@/content/forms";
import { REPAIR_STEPS } from "@/lib/validation/forms";
import type { FieldErrors } from "@/lib/validation/common";
import { submitRepairRequest, type RepairActionState } from "@/lib/actions/forms";
import { repairRequestMessage, whatsappUrl } from "@/lib/whatsapp";
import { buttonClasses, ButtonLink, ExternalButton } from "@/components/ui/button";
import { PendingTag } from "@/components/ui/primitives";
import { IconArrowRight, IconShield, IconWhatsApp } from "@/components/ui/icons";
import {
  CheckboxField,
  FormAlert,
  Honeypot,
  RadioCards,
  SelectField,
  TextAreaField,
  TextField,
} from "./fields";
import { PhotoPicker, type PickedPhoto } from "./photo-picker";
import { focusFirstError, formValues, omitKey, validateWith } from "./form-helpers";
import { Turnstile, type TurnstileHandle } from "./turnstile";
import { compressImage, MAX_UPLOAD_BYTES } from "@/lib/images/compress";

const FIELD_ORDER = [
  "equipmentType",
  "brand",
  "model",
  "issue",
  "deliveryMethod",
  "returnShipping",
  "name",
  "phone",
  "email",
  "state",
  "city",
  "privacy",
];

const STEP_FIELDS: string[][] = REPAIR_STEPS.map((s) => Object.keys(s.schema.shape));

type Success = Extract<RepairActionState, { status: "success" }>;

export function RepairForm({
  pickupNote,
  returnNote,
  whatsappNumber,
}: {
  pickupNote: string | null;
  returnNote: string | null;
  whatsappNumber?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const turnstile = useRef<TurnstileHandle>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [success, setSuccess] = useState<Success>();
  const [pending, startTransition] = useTransition();

  const last = step === REPAIR_STEPS.length - 1;

  function goTo(next: number) {
    setStep(next);
    setFormError(undefined);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function validateStep(index: number): boolean {
    const form = formRef.current;
    if (!form) return false;
    const stepErrors = validateWith(REPAIR_STEPS[index]!.schema, formValues(form));
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      setFormError("Revisa los campos marcados en rojo.");
      focusFirstError(form, stepErrors, FIELD_ORDER);
      return false;
    }
    setFormError(undefined);
    return true;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!last) {
      if (validateStep(step)) goTo(step + 1);
      return;
    }
    if (!validateStep(step)) return;

    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        // Fotos: se comprimen en el navegador (y pierden el EXIF) antes de subirlas.
        const compressed = await Promise.all(photos.map((p) => compressImage(p.file)));
        const total = compressed.reduce((sum, f) => sum + f.size, 0);
        if (total > MAX_UPLOAD_BYTES) {
          setFormError("Las fotos pesan demasiado juntas. Quita alguna o elige fotos más livianas.");
          return;
        }
        data.delete("photos");
        for (const file of compressed) data.append("photos", file);

        const result = await submitRepairRequest({ status: "idle" }, data);
        if (result.status === "success") {
          setSuccess(result);
          requestAnimationFrame(() => {
            headingRef.current?.focus();
            headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
          });
        } else if (result.status === "error") {
          turnstile.current?.reset();
          setErrors(result.fieldErrors);
          setFormError(result.message);
          const badStep = STEP_FIELDS.findIndex((fields) => fields.some((f) => result.fieldErrors[f]));
          if (badStep >= 0 && badStep !== step) setStep(badStep);
          requestAnimationFrame(() => focusFirstError(formRef.current, result.fieldErrors, FIELD_ORDER));
        }
      } catch {
        setFormError(
          "No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.",
        );
      }
    });
  }

  /** Al corregir un campo, se quita su error. */
  function onInput(e: FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name;
    if (name && errors[name]) {
      setErrors((prev) => omitKey(prev, name));
    }
  }

  if (success) {
    const s = success.summary;
    const message = repairRequestMessage({
      requestNumber: success.requestNumber,
      name: s.name,
      equipment: s.equipment,
      brand: s.brand,
      issue: s.issue,
      deliveryMethod: s.deliveryMethod,
    });
    return (
      <div className="rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line sm:p-10">
        <span className="grid size-14 place-items-center rounded-2xl bg-success-soft text-success">
          <IconShield size={30} />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="mt-6 text-3xl font-bold focus:outline-none">
          ¡Recibimos tu solicitud, {s.name}!
        </h2>
        <p className="mt-3 text-lg text-ink-soft">
          Tu número de solicitud es{" "}
          <strong className="font-display text-xl whitespace-nowrap text-ink">{success.requestNumber}</strong>
          {success.simulated && (
            <>
              {" "}
              <PendingTag>[SIMULACIÓN]</PendingTag>
            </>
          )}
          . Te contactaremos por WhatsApp para indicarte los siguientes pasos.
        </p>

        <dl className="mt-8 grid gap-4 rounded-2xl bg-sand/60 p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Equipo</dt>
            <dd className="font-semibold">
              {s.equipment} · {s.brand}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Entrega</dt>
            <dd className="font-semibold">{s.deliveryMethod}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted">Falla</dt>
            <dd className="font-semibold whitespace-pre-line">{s.issue}</dd>
          </div>
          {s.returnShipping && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted">Devolución</dt>
              <dd className="font-semibold">Envío de vuelta a tu ciudad (coste extra)</dd>
            </div>
          )}
        </dl>

        <p className="mt-8 text-ink-soft">
          <strong className="text-ink">¿Quieres ir más rápido?</strong> Envíanos el resumen por WhatsApp y, si
          tienes más fotos o videos del equipo, adjúntalos en el chat.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ExternalButton href={whatsappUrl(message, whatsappNumber)} variant="whatsapp" size="lg">
            <IconWhatsApp size={22} />
            Enviar resumen por WhatsApp
          </ExternalButton>
          <ButtonLink href="/" variant="secondary" size="lg">
            Volver al inicio
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onInput={onInput}
      aria-labelledby="repair-step-title"
      className="relative rounded-(--radius-card) bg-surface p-6 shadow-soft ring-1 ring-line sm:p-10"
    >
      <Honeypot />

      {/* Indicador de pasos */}
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Pasos de la solicitud">
        {REPAIR_STEPS.map((s, i) => (
          <li key={s.title} aria-current={i === step ? "step" : undefined} className="flex flex-col gap-2">
            <span
              aria-hidden="true"
              className={clsx(
                "h-1.5 rounded-full transition-colors duration-300",
                i <= step ? "bg-brand" : "bg-line",
              )}
            />
            <span className={clsx("text-sm font-semibold", i === step ? "text-ink" : "text-muted")}>
              <span className="sr-only">Paso {i + 1} de 3: </span>
              {s.title}
              {i < step && <span className="sr-only"> (completado)</span>}
            </span>
          </li>
        ))}
      </ol>

      <h2
        id="repair-step-title"
        ref={headingRef}
        tabIndex={-1}
        className="scroll-mt-28 text-2xl font-bold focus:outline-none sm:text-3xl"
      >
        <span className="text-muted">{step + 1}/3 · </span>
        {step === 0 && "¿Qué equipo hay que reparar?"}
        {step === 1 && "¿Cómo nos harás llegar tu equipo?"}
        {step === 2 && "¿Cómo te contactamos?"}
      </h2>

      {formError && (
        <div className="mt-6">
          <FormAlert>{formError}</FormAlert>
        </div>
      )}

      {/* Paso 1 — Equipo */}
      <fieldset hidden={step !== 0} className="mt-8 grid gap-6">
        <legend className="sr-only">Tu equipo</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            name="equipmentType"
            label="Tipo de equipo"
            options={EQUIPMENT_TYPES}
            error={errors.equipmentType}
          />
          <TextField
            name="brand"
            label="Marca"
            list="brand-options"
            autoComplete="off"
            maxLength={60}
            placeholder="Ej.: Oster"
            hint="Si no la sabes, escribe «No sé»."
            error={errors.brand}
          />
          <datalist id="brand-options">
            {COMMON_BRANDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
        <TextField
          name="model"
          label="Modelo"
          optional
          maxLength={80}
          autoComplete="off"
          error={errors.model}
        />
        <TextAreaField
          name="issue"
          label="¿Qué le pasa?"
          hint="Cuéntanos con tus palabras: qué hace, qué no hace y desde cuándo."
          maxLength={1500}
          placeholder="Ej.: La lavadora llena de agua pero no centrifuga y hace un ruido fuerte."
          error={errors.issue}
        />
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </fieldset>

      {/* Paso 2 — Entrega */}
      <fieldset hidden={step !== 1} className="mt-8 grid gap-8">
        <legend className="sr-only">Entrega del equipo</legend>
        <RadioCards
          name="deliveryMethod"
          legend="Elige una opción"
          error={errors.deliveryMethod}
          options={DELIVERY_METHOD_KEYS.map((key) => ({
            value: key,
            label: DELIVERY_METHODS[key].label,
            description: (
              <>
                {DELIVERY_METHODS[key].description}
                {key === "pickup" && (
                  <span className="mt-1 block">Coste orientativo: {pickupNote ?? <PendingTag />}</span>
                )}
              </>
            ),
          }))}
        />
        <RadioCards
          name="returnShipping"
          legend="Cuando esté listo, ¿quieres que te lo enviemos?"
          error={errors.returnShipping}
          columns={2}
          options={[
            { value: "no", label: "No, lo retiro en el local", description: "Sin coste." },
            {
              value: "yes",
              label: "Sí, envíenmelo",
              description: (
                <>
                  Tiene un coste extra a tu cargo.
                  <span className="mt-1 block">Coste orientativo: {returnNote ?? <PendingTag />}</span>
                </>
              ),
            },
          ]}
        />
      </fieldset>

      {/* Paso 3 — Datos de contacto */}
      <fieldset hidden={step !== 2} className="mt-8 grid gap-6">
        <legend className="sr-only">Tus datos</legend>
        <TextField
          name="name"
          label="Nombre y apellido"
          autoComplete="name"
          maxLength={100}
          error={errors.name}
        />
        <div className="grid gap-6 sm:grid-cols-2">
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
          <TextField
            name="email"
            label="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            optional
            maxLength={254}
            error={errors.email}
          />
        </div>
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
        <CheckboxField name="privacy" error={errors.privacy}>
          He leído y acepto la{" "}
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
        {last && <Turnstile ref={turnstile} action="repair" />}
      </fieldset>

      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className={buttonClasses("ghost", "lg")}
            disabled={pending}
          >
            Atrás
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          className={buttonClasses("primary", "lg")}
          disabled={pending}
          aria-busy={pending}
        >
          {last ? (pending ? "Enviando…" : "Enviar solicitud") : "Continuar"}
          {!pending && <IconArrowRight size={20} />}
        </button>
      </div>
    </form>
  );
}
