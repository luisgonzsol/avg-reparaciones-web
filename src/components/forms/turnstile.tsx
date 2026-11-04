"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loader: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loader ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    script.onerror = () => {
      loader = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(script);
  });
  return loader;
}

export type TurnstileHandle = { reset: () => void };

/**
 * Casilla antispam de Cloudflare Turnstile. Añade al formulario el campo
 * oculto "cf-turnstile-response", que el servidor verifica. Si no hay clave
 * configurada, no muestra nada.
 */
export function Turnstile({ ref, action }: { ref?: Ref<TurnstileHandle>; action?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widget.current) window.turnstile?.reset(widget.current);
    },
  }));

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let cancelled = false;
    const el = box.current;
    loadTurnstile()
      .then((api) => {
        if (cancelled || widget.current) return;
        widget.current = api.render(el, {
          sitekey: SITE_KEY,
          action,
          language: "es",
          theme: "light",
          size: "flexible",
        });
      })
      .catch(() => {
        // Sin conexión con Cloudflare: el servidor decidirá.
      });
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [action]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" aria-label="Verificación antispam" />;
}
