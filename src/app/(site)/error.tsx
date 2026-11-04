"use client";

import { useEffect } from "react";
import { buttonClasses, ExternalButton } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { IconWhatsApp } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * Error inesperado. Al usuario solo se le muestra un mensaje genérico; el
 * detalle queda en los logs del servidor (identificable por `digest`).
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;

  useEffect(() => {
    // Solo en el navegador del usuario; no contiene datos personales.
    console.error("Error en la página", digest ?? "");
  }, [digest]);

  return (
    <Container className="flex min-h-[70dvh] flex-col justify-center py-16">
      <p aria-hidden="true" className="font-display text-6xl font-extrabold text-flame">
        ¡Ups!
      </p>
      <h1 className="mt-4 max-w-xl text-3xl font-extrabold sm:text-4xl">Algo no funcionó como esperábamos</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        Tuvimos un problema al cargar esta página. Inténtalo de nuevo en unos segundos. Si sigue fallando,
        escríbenos por WhatsApp y te atendemos.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => retry()} className={buttonClasses("primary", "lg")}>
          Intentar de nuevo
        </button>
        <ExternalButton href={whatsappUrl()} variant="secondary" size="lg">
          <IconWhatsApp size={22} className="text-[#1f8f4e]" />
          Escríbenos
        </ExternalButton>
      </div>
      {digest && <p className="mt-8 text-sm text-muted">Código de referencia: {digest}</p>}
    </Container>
  );
}
