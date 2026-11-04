/**
 * Campos de formulario accesibles: cada campo tiene su <label>, su ayuda y su
 * mensaje de error asociados con aria-describedby / aria-invalid.
 */
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

const control =
  "block w-full rounded-xl border border-line bg-surface px-4 text-base text-ink shadow-[inset_0_1px_2px_rgb(22_22_22/0.04)] " +
  "placeholder:text-muted/80 transition-[border-color,box-shadow] duration-200 " +
  "hover:border-ink/30 focus:border-ink focus:outline-none focus:ring-4 focus:ring-bolt/40 " +
  "aria-[invalid=true]:border-brand aria-[invalid=true]:ring-brand/15";

function describedBy(name: string, hint?: ReactNode, error?: string) {
  return clsx(hint && `${name}-hint`, error && `${name}-error`) || undefined;
}

type FieldShellProps = {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

export function FieldShell({ name, label, hint, error, optional, children, className }: FieldShellProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 text-sm font-normal text-muted">(opcional)</span>}
      </label>
      {hint && (
        <p id={`${name}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {children}
      <FieldError name={name} error={error} />
    </div>
  );
}

export function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${name}-error`} className="flex items-start gap-1.5 text-sm font-medium text-brand-ink">
      <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Zm0 9.25a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />
      </svg>
      {error}
    </p>
  );
}

type BaseProps = { name: string; label: ReactNode; hint?: ReactNode; error?: string; optional?: boolean };

export function TextField({
  name,
  label,
  hint,
  error,
  optional,
  className,
  ...props
}: BaseProps & Omit<ComponentProps<"input">, "name">) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        required={!optional}
        className={clsx(control, "min-h-13")}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  error,
  optional,
  className,
  ...props
}: BaseProps & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error} optional={optional} className={className}>
      <textarea
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        required={!optional}
        rows={5}
        className={clsx(control, "py-3 leading-relaxed")}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  error,
  optional,
  options,
  placeholder = "Elige una opción",
  className,
  ...props
}: BaseProps & { options: readonly string[]; placeholder?: string } & Omit<
    ComponentProps<"select">,
    "name"
  >) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <select
          id={name}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(name, hint, error)}
          required={!optional}
          className={clsx(control, "min-h-13 appearance-none pr-11")}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </FieldShell>
  );
}

/** Grupo de opciones grandes (radio) con descripción, fácil de tocar. */
export function RadioCards({
  name,
  legend,
  options,
  error,
  hint,
  defaultValue,
  columns = 1,
}: {
  name: string;
  legend: ReactNode;
  options: { value: string; label: string; description?: ReactNode }[];
  error?: string;
  hint?: ReactNode;
  defaultValue?: string;
  columns?: 1 | 2 | 3;
}) {
  return (
    <fieldset aria-describedby={describedBy(name, hint, error)} aria-invalid={error ? true : undefined}>
      <legend className="font-semibold text-ink">{legend}</legend>
      {hint && (
        <p id={`${name}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      <div
        className={clsx(
          "mt-3 grid gap-3",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-3",
        )}
      >
        {options.map((o, i) => (
          <label
            key={o.value}
            className={clsx(
              "flex min-h-14 cursor-pointer gap-3 rounded-xl border bg-surface p-4 transition-[border-color,box-shadow,background-color]",
              "hover:border-ink/30 has-[:checked]:border-ink has-[:checked]:bg-sand/50 has-[:checked]:shadow-soft",
              "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-bolt/40",
              error ? "border-brand" : "border-line",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={defaultValue === o.value}
              required={i === 0}
              className="mt-1 size-5 shrink-0 accent-brand"
            />
            <span>
              <span className="block font-semibold text-ink">{o.label}</span>
              {o.description && <span className="mt-0.5 block text-sm text-ink-soft">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-2">
        <FieldError name={name} error={error} />
      </div>
    </fieldset>
  );
}

export function CheckboxField({
  name,
  children,
  error,
}: {
  name: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl p-1">
        <input
          id={name}
          type="checkbox"
          name={name}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-brand"
        />
        <span className="text-ink-soft">{children}</span>
      </label>
      <FieldError name={name} error={error} />
    </div>
  );
}

/** Campo trampa para bots: invisible para personas y lectores de pantalla. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="website">No rellenes este campo</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function FormAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-xl p-4 text-[0.95rem] font-medium ring-1",
        tone === "error" ? "bg-brand-soft text-brand-ink ring-brand/30" : "bg-sand text-ink-soft ring-line",
      )}
    >
      {children}
    </div>
  );
}
