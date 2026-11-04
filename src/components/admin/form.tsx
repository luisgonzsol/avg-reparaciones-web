"use client";
/**
 * Formularios del panel: <ActionForm> conecta una Server Action con
 * useActionState, muestra el resultado (éxito o error) y reparte los errores
 * por campo a los <Field> de dentro.
 */
import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import type { ActionResult } from "@/lib/actions/admin";
import { buttonClasses } from "@/components/ui/button";

const ErrorsContext = createContext<Record<string, string>>({});

export function ActionForm({
  action,
  children,
  submitLabel = "Guardar",
  pendingLabel = "Guardando…",
  className,
  resetOnSuccess = false,
  submitVariant = "primary",
  hideSubmit = false,
  encType,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  submitVariant?: "primary" | "secondary";
  hideSubmit?: boolean;
  encType?: "multipart/form-data";
}) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <ErrorsContext value={state?.fieldErrors ?? {}}>
      <form
        ref={formRef}
        action={formAction}
        className={clsx("flex flex-col gap-5", className)}
        encType={encType}
        noValidate
      >
        {children}
        {state && <ResultMessage state={state} />}
        {!hideSubmit && (
          <SubmitButton label={submitLabel} pendingLabel={pendingLabel} variant={submitVariant} />
        )}
      </form>
    </ErrorsContext>
  );
}

export function ResultMessage({ state }: { state: NonNullable<ActionResult> }) {
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={clsx(
        "rounded-xl px-4 py-3 text-[0.95rem] font-medium",
        state.ok ? "bg-success-soft text-success" : "bg-brand/8 text-brand-ink ring-1 ring-brand/20",
      )}
    >
      {state.message}
      {state.details?.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 font-normal">
          {state.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  label,
  pendingLabel = "Guardando…",
  variant = "primary",
  className,
  name,
  value,
}: {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={buttonClasses(variant, "md", clsx("self-start", className))}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/** Botón de envío que pide confirmación antes de una acción delicada. */
export function ConfirmButton({
  label,
  confirm,
  variant = "ghost",
  className,
}: {
  label: string;
  confirm: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      className={buttonClasses(variant, "md", className)}
    >
      {pending ? "Un momento…" : label}
    </button>
  );
}

/* ---------- Campos ---------- */

export const adminControl =
  "block w-full rounded-xl border border-line bg-surface px-3.5 text-base text-ink " +
  "hover:border-ink/30 focus:border-ink focus:outline-none focus:ring-4 focus:ring-bolt/40 " +
  "aria-[invalid=true]:border-brand";

export function Field({
  name,
  label,
  hint,
  children,
  className,
  errorKey,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
  className?: string;
  /** Clave del error si no coincide con el nombre del campo. */
  errorKey?: string;
}) {
  const errors = useContext(ErrorsContext);
  const id = `${useId()}-${name}`;
  const error = errors[errorKey ?? name];
  const describedBy = clsx(hint && `${id}-hint`, error && `${id}-error`) || undefined;
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-brand-ink">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = Omit<ComponentProps<"input">, "name" | "id"> & {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
};

export function Input({ name, label, hint, className, ...props }: InputProps) {
  return (
    <Field name={name} label={label} hint={hint} className={className}>
      {(a) => <input name={name} {...a} {...props} className={clsx(adminControl, "min-h-12")} />}
    </Field>
  );
}

export function Textarea({
  name,
  label,
  hint,
  className,
  ...props
}: Omit<ComponentProps<"textarea">, "name" | "id"> & { name: string; label: ReactNode; hint?: ReactNode }) {
  return (
    <Field name={name} label={label} hint={hint} className={className}>
      {(a) => <textarea name={name} rows={4} {...a} {...props} className={clsx(adminControl, "py-2.5")} />}
    </Field>
  );
}

export function Select({
  name,
  label,
  hint,
  options,
  className,
  placeholder,
  ...props
}: Omit<ComponentProps<"select">, "name" | "id"> & {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Field name={name} label={label} hint={hint} className={className}>
      {(a) => (
        <select name={name} {...a} {...props} className={clsx(adminControl, "min-h-12")}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  defaultChecked?: boolean;
}) {
  const id = `${useId()}-${name}`;
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-6 shrink-0 accent-brand"
      />
      <label htmlFor={id} className="flex flex-col">
        <span className="font-semibold">{label}</span>
        {hint && <span className="text-sm text-muted">{hint}</span>}
      </label>
    </div>
  );
}

/** Error de un grupo de campos (p. ej. el horario) que no es un input concreto. */
export function GroupError({ name }: { name: string }) {
  const errors = useContext(ErrorsContext);
  if (!errors[name]) return null;
  return <p className="text-sm font-medium text-brand-ink">{errors[name]}</p>;
}
