import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} {...props} />;
}

export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={clsx("py-16 sm:py-24", className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  id,
  align = "left",
  tone = "light",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  id?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  return (
    <div className={clsx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p
          className={clsx(
            "mb-3 inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase",
            tone === "dark" ? "text-bolt" : "text-brand-ink",
          )}
        >
          <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-flame" />
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={clsx("text-3xl font-bold sm:text-4xl", tone === "dark" ? "text-white" : "text-ink")}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={clsx("mt-4 text-lg", tone === "dark" ? "text-white/80" : "text-ink-soft")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Etiqueta visible para datos que faltan: [PENDIENTE], [PLACEHOLDER], [EJEMPLO]. */
export function PendingTag({
  children = "[PENDIENTE]",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border border-dashed border-flame/70 bg-warning-soft px-1.5 py-0.5 align-middle font-mono text-[0.72rem] font-semibold text-warning",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Texto o etiqueta [PENDIENTE] si el valor no existe. */
export function OrPending({ value }: { value: string | null | undefined }) {
  return value ? <>{value}</> : <PendingTag />;
}
