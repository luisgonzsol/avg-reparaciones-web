"use client";

import { buttonClasses } from "@/components/ui/button";

export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="max-w-xl rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-line">
      <h1 className="text-2xl font-extrabold">Algo salió mal</h1>
      <p className="mt-2 text-ink-soft">
        No se pudo cargar esta sección. Inténtalo de nuevo; si sigue fallando, avisa al técnico.
      </p>
      <button type="button" onClick={retry} className={buttonClasses("primary", "md", "mt-5")}>
        Reintentar
      </button>
    </div>
  );
}
