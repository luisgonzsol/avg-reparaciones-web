import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "whatsapp" | "inverse";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap " +
  "transition-[background-color,color,box-shadow,transform] duration-200 ease-(--ease-out-soft) " +
  "motion-safe:active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-soft hover:bg-brand-hover hover:shadow-lift",
  secondary: "bg-surface text-ink ring-1 ring-inset ring-line hover:ring-ink/40 hover:shadow-soft",
  ghost: "text-ink hover:bg-sand",
  whatsapp: "bg-[#1f8f4e] text-white shadow-soft hover:bg-[#187a41] hover:shadow-lift",
  inverse: "bg-white text-ink hover:bg-canvas",
};

// Área táctil mínima de 48 px (por encima del mínimo de 44 px).
const sizes: Record<Size, string> = {
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-[1.05rem]",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

type ExternalButtonProps = Omit<ComponentProps<"a">, "className" | "target" | "rel"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
};

/** Enlace externo: siempre abre en otra pestaña con rel seguro. */
export function ExternalButton({ variant, size, className, children, ...props }: ExternalButtonProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {children}
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}
