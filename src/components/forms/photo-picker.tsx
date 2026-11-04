"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PHOTO_LIMITS } from "@/content/forms";
import { checkPhoto } from "@/lib/files";
import { IconClose, IconImage } from "@/components/ui/icons";
import { FieldError } from "./fields";

export type PickedPhoto = { id: string; file: File; url: string };

/**
 * Selector de hasta 3 fotos. Valida tipo REAL (magic bytes) y tamaño en el
 * navegador; al enviar se comprimen (sin EXIF) y el servidor lo vuelve a
 * validar y re-codificar todo.
 */
export function PhotoPicker({
  photos,
  onChange,
}: {
  photos: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const remaining = PHOTO_LIMITS.maxFiles - photos.length;

  // Libera las URLs temporales al desmontar.
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    setError(undefined);
    const files = Array.from(list);
    if (files.length > remaining) {
      setError(`Puedes añadir hasta ${PHOTO_LIMITS.maxFiles} fotos.`);
    }
    const accepted: PickedPhoto[] = [];
    for (const file of files.slice(0, remaining)) {
      const result = await checkPhoto(file);
      if (!result.ok) {
        setError(result.error);
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
    }
    if (accepted.length) onChange([...photos, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.url);
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold text-ink">
        Fotos del equipo <span className="text-sm font-normal text-muted">(opcional, hasta 3)</span>
      </p>
      <p id={`${inputId}-hint`} className="text-sm text-muted">
        Una foto de la etiqueta con la marca y el modelo nos ayuda mucho. Formatos JPG, PNG o WEBP, máximo 5
        MB cada una.
      </p>

      <ul className="mt-1 grid grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <li
            key={p.id}
            className="relative aspect-square overflow-hidden rounded-xl bg-sand ring-1 ring-line"
          >
            {/* Vista previa local (blob:): se sube solo al enviar la solicitud. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Foto ${i + 1} seleccionada`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="absolute top-1.5 right-1.5 grid size-10 place-items-center rounded-full bg-ink/80 text-white hover:bg-ink"
            >
              <IconClose size={18} />
              <span className="sr-only">Quitar foto {i + 1}</span>
            </button>
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <label
              htmlFor={inputId}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-surface p-2 text-center text-sm font-medium text-ink-soft transition-colors hover:border-ink/40 hover:text-ink has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-bolt/40"
            >
              <IconImage size={28} />
              Añadir foto
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={PHOTO_LIMITS.mimeTypes.join(",")}
                multiple
                aria-describedby={`${inputId}-hint${error ? ` ${inputId}-error` : ""}`}
                className="sr-only"
                onChange={(e) => void handleFiles(e.target.files)}
              />
            </label>
          </li>
        )}
      </ul>
      <FieldError name={inputId} error={error} />
    </div>
  );
}
