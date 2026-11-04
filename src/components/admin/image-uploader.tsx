"use client";

import { useActionState, useRef, useState, useTransition, type FormEvent } from "react";
import { uploadProductImages, type ActionResult } from "@/lib/actions/admin";
import { compressImage, MAX_UPLOAD_BYTES } from "@/lib/images/compress";
import { buttonClasses } from "@/components/ui/button";
import { ResultMessage, adminControl } from "./form";

/**
 * Subida de imágenes de producto: se comprimen en el navegador (sin EXIF) y
 * el servidor las valida, las convierte a WEBP y las guarda en Storage.
 */
export function ImageUploader({ productId, productName }: { productId: string; productName: string }) {
  const [state, action] = useActionState(uploadProductImages, null as ActionResult);
  const [pending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const files = data.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    if (!String(data.get("alt") ?? "").trim()) data.set("alt", productName);
    setLocalError(undefined);
    startTransition(async () => {
      const compressed = await Promise.all(files.map((f) => compressImage(f, 1600, 0.85)));
      data.delete("images");
      let total = 0;
      for (const f of compressed) {
        total += f.size;
        data.append("images", f);
      }
      if (total > MAX_UPLOAD_BYTES) {
        setLocalError("Las imágenes pesan demasiado juntas. Súbelas de una en una.");
        return;
      }
      action(data);
      form.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="images" className="font-semibold">
          Añadir imágenes
        </label>
        <p className="text-sm text-muted">JPG, PNG o WEBP, máximo 5 MB cada una. Hasta 8 por producto.</p>
        <input
          id="images"
          name="images"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          required
          className="block w-full rounded-xl border border-dashed border-line bg-surface p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-white"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="alt" className="font-semibold">
          Descripción de la imagen
        </label>
        <p className="text-sm text-muted">
          Para personas ciegas y para Google. Si la dejas vacía se usa el nombre.
        </p>
        <input
          id="alt"
          name="alt"
          maxLength={200}
          placeholder={productName}
          className={`${adminControl} min-h-12`}
        />
      </div>
      {localError ? (
        <ResultMessage state={{ ok: false, message: localError }} />
      ) : (
        state && <ResultMessage state={state} />
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={buttonClasses("secondary", "md", "self-start")}
      >
        {pending ? "Subiendo…" : "Subir imágenes"}
      </button>
    </form>
  );
}
