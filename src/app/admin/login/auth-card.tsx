import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <main id="contenido" className="grid flex-1 place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-(--radius-card) bg-surface p-7 shadow-soft ring-1 ring-line sm:p-9">
        <Logo height={40} />
        <h1 className="mt-8 text-2xl font-extrabold">{title}</h1>
        <p className="mt-2 mb-7 text-ink-soft">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
