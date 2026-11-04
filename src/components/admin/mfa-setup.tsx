"use client";

import { useActionState, useState, useTransition } from "react";
import {
  changePassword,
  confirmMfaEnroll,
  removeMfa,
  startMfaEnroll,
  type AuthFormState,
  type EnrollState,
} from "@/lib/actions/admin-auth";
import { buttonClasses } from "@/components/ui/button";
import { SubmitButton, adminControl } from "./form";

function Message({ state }: { state: AuthFormState }) {
  if (!state) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={
        state.error
          ? "rounded-xl bg-brand/8 px-4 py-3 font-medium text-brand-ink ring-1 ring-brand/20"
          : "rounded-xl bg-success-soft px-4 py-3 font-medium text-success"
      }
    >
      {state.error ?? state.ok}
    </p>
  );
}

/** Activación de la verificación en dos pasos (TOTP) con una app del móvil. */
export function MfaSetup({ enabled }: { enabled: boolean }) {
  const [current, setEnroll] = useState<EnrollState>(enabled ? { step: "done" } : { step: "idle" });
  const [removeState, setRemoveState] = useState<AuthFormState>(null);
  const [pending, startTransition] = useTransition();

  if (current.step === "done") {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-success-soft px-4 py-3 font-medium text-success">
          La verificación en dos pasos está activada. Al entrar se te pedirá el código de tu app.
        </p>
        <Message state={removeState} />
        <button
          type="button"
          disabled={pending}
          className={buttonClasses("secondary", "md", "self-start")}
          onClick={() => {
            if (
              !window.confirm("¿Desactivar la verificación en dos pasos? El panel quedará menos protegido.")
            )
              return;
            startTransition(async () => {
              const r = await removeMfa();
              setRemoveState(r);
              if (r?.ok) setEnroll({ step: "idle" });
            });
          }}
        >
          {pending ? "Un momento…" : "Desactivar"}
        </button>
      </div>
    );
  }

  if (current.step === "idle") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-soft">
          Además de la contraseña, se pedirá un código de 6 números que genera una app gratuita en tu móvil
          (Google Authenticator, Microsoft Authenticator o similar). Aunque alguien consiga tu contraseña, no
          podrá entrar.
        </p>
        {current.error && <Message state={{ error: current.error }} />}
        <button
          type="button"
          disabled={pending}
          className={buttonClasses("primary", "md", "self-start")}
          onClick={() => startTransition(async () => setEnroll(await startMfaEnroll()))}
        >
          {pending ? "Preparando…" : "Activar verificación en dos pasos"}
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(async () => setEnroll(await confirmMfaEnroll(current, data)));
      }}
    >
      <ol className="list-decimal space-y-2 pl-5 text-ink-soft">
        <li>Instala en tu móvil Google Authenticator o Microsoft Authenticator.</li>
        <li>En la app, pulsa «+» y escanea este código QR.</li>
        <li>Escribe abajo el código de 6 números que aparece.</li>
      </ol>
      {/* QR en SVG generado por Supabase (data:), sin servicios externos. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.qr}
        alt="Código QR para la app de autenticación"
        className="size-52 rounded-xl bg-white p-2 ring-1 ring-line"
      />
      <details className="text-sm text-ink-soft">
        <summary className="min-h-11 cursor-pointer font-semibold">
          ¿No puedes escanearlo? Escribe la clave a mano
        </summary>
        <code className="mt-2 block rounded-lg bg-sand px-3 py-2 font-mono break-all select-all">
          {current.secret}
        </code>
      </details>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mfa-code" className="font-semibold">
          Código de 6 números
        </label>
        <input
          id="mfa-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          className={`${adminControl} min-h-14 max-w-56 text-center font-display text-2xl tracking-[0.4em]`}
        />
      </div>
      {current.error && <Message state={{ error: current.error }} />}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={buttonClasses("primary", "md", "self-start")}
      >
        {pending ? "Comprobando…" : "Confirmar y activar"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="font-semibold">
          Nueva contraseña
        </label>
        <p className="text-sm text-muted">
          Mínimo 12 caracteres. Una frase larga es fácil de recordar y difícil de adivinar.
        </p>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          required
          className={`${adminControl} min-h-12`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="font-semibold">
          Repite la contraseña
        </label>
        <input
          id="confirm-password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          maxLength={72}
          required
          className={`${adminControl} min-h-12`}
        />
      </div>
      <Message state={state} />
      <SubmitButton label="Cambiar contraseña" />
    </form>
  );
}
