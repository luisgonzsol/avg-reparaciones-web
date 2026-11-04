"use client";

import { useActionState } from "react";
import { login, verifyMfa, type AuthFormState } from "@/lib/actions/admin-auth";
import { Turnstile } from "@/components/forms/turnstile";
import { SubmitButton, adminControl } from "./form";

function Alert({ state }: { state: AuthFormState }) {
  if (!state?.error) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-brand/8 px-4 py-3 font-medium text-brand-ink ring-1 ring-brand/20"
    >
      {state.error}
    </p>
  );
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action] = useActionState(login, initialError ? { error: initialError } : null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          className={`${adminControl} min-h-12`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="font-semibold">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          className={`${adminControl} min-h-12`}
        />
      </div>
      <Turnstile action="admin-login" />
      <Alert state={state} />
      <SubmitButton label="Entrar" pendingLabel="Entrando…" className="w-full" />
    </form>
  );
}

export function MfaForm() {
  const [state, action] = useActionState(verifyMfa, null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="font-semibold">
          Código de 6 números
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          className={`${adminControl} min-h-14 text-center font-display text-2xl tracking-[0.4em]`}
        />
      </div>
      <Alert state={state} />
      <SubmitButton label="Verificar" pendingLabel="Verificando…" className="w-full" />
    </form>
  );
}
