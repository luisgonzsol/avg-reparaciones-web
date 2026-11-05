import { serializeJsonLd } from "@/lib/seo/json-ld";

/**
 * Datos estructurados para buscadores. Es la única excepción a la regla de
 * no usar dangerouslySetInnerHTML: el contenido es JSON generado por nuestras
 * funciones y serializeJsonLd escapa los caracteres que podrían cerrar el
 * <script>. Un bloque application/ld+json no se ejecuta.
 */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
