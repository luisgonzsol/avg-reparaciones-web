"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { CONTACT_TOPICS } from "@/content/forms";
import { contactSchema } from "@/lib/validation/forms";
import type { FieldErrors } from "@/lib/validation/common";
import { submitContactMessage } from "@/lib/actions/forms";
import { buttonClasses } from "@/components/ui/button";
import { PendingTag } from "@/components/ui/primitives";
import { IconShield } from "@/components/ui/icons";
import { CheckboxField, FormAlert, Honeypot, SelectField, TextAreaField, TextField } from "./fields";
import { focusFirstError, formValues, omitKey, validateWith } from "./form-helpers";
import { Turnstile, type TurnstileHandle } from "./turnstile";

const ORDER = ["name", "phone", "email", "topic", "message", "privacy"];

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const turnstile = useRef<TurnstileHandle>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [done, setDone] = useState<{ simulated: boolean }>();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const clientErrors = validateWith(contactSchema, formValues(form));
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setFormError("Revisa los campos marcados en rojo.");
      focusFirstError(form, clientErrors, ORDER);
      return;
    }
    const data = new FormData(form);
    startTransition(async () => {
      try {
        const result = await submitContactMessage({ status: "idle" }, data);
        if (result.status === "success") {
          setDone({ simulated: result.simulated });
          requestAnimationFrame(() => doneRef.current?.focus());
        } else if (result.status === "error") {
          turnstile.current?.reset();
          setErrors(result.fieldErrors);
          setFormError(result.message);
          requestAnimationFrame(() => focusFirstError(formRef.current, result.fieldErrors, ORDER));
        }
      } catch {
        setFormError(
          "No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.",
        );
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line sm:p-9">
        <span className="grid size-12 place-items-center rounded-2xl bg-success-soft text-success">
          <IconShield size={26} />
        </span>
        <h2 ref={doneRef} tabIndex={-1} className="mt-5 text-2xl font-bold focus:outline-none">
          ¡Gracias! Recibimos tu mensaje
          {done.simulated && (
            <>
              {" "}
              <PendingTag>[SIMULACIÓN]</PendingTag>
            </>
          )}
        </h2>
        <p className="mt-3 text-ink-soft">Te responderemos lo antes posible por WhatsApp o por correo.</p>
        <button
          type="button"
          className={buttonClasses("secondary", "md", "mt-6")}
          onClick={() => setDone(undefined)}
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onInput={(e) => {
        const name = (e.target as HTMLInputElement).name;
        if (name && errors[name]) setErrors((prev) => omitKey(prev, name));
      }}
      aria-labelledby="contact-form-title"
      className="relative grid gap-6 rounded-(--radius-card) bg-surface p-6 shadow-soft ring-1 ring-line sm:p-9"
    >
      <Honeypot />
      <h2 id="contact-form-title" className="text-2xl font-bold">
        Escríbenos un mensaje
      </h2>
      {formError && <FormAlert>{formError}</FormAlert>}
      <TextField name="name" label="Nombre" autoComplete="name" maxLength={100} error={errors.name} />
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
      <SelectField name="topic" label="Motivo" options={CONTACT_TOPICS} error={errors.topic} />
      <TextAreaField name="message" label="Mensaje" maxLength={2000} error={errors.message} />
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
      <Turnstile ref={turnstile} action="contact" />
      <button
        type="submit"
        className={buttonClasses("primary", "lg", "sm:justify-self-start")}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
