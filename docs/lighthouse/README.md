# Informe Lighthouse (móvil)

Lighthouse 12.8, perfil móvil (4G lento simulado, CPU ×4), contra el build de producción
(`next build && next start`) en local, 5 de noviembre de 2026. Abre los `.html` para el detalle.

| Página                | Rendimiento | Accesibilidad | Buenas prácticas | SEO  |
| --------------------- | ----------- | ------------- | ---------------- | ---- |
| Inicio                | 91          | 100           | 100              | 100  |
| Tienda                | 92          | 100           | 100              | 100  |
| Ficha de producto     | 96          | 100           | 100              | 66\* |
| Servicio (reparación) | 92          | 100           | 100              | 100  |
| Solicitar reparación  | 91          | 100           | 100              | 100  |
| Contacto              | 92          | 100           | 100              | 100  |

\* El producto analizado es de **ejemplo** (`is_sample`) y lleva `noindex` a propósito para
que Google no indexe productos ficticios. Con un producto real el SEO es 100.

En Vercel (compresión Brotli, CDN y servidor en Dublín) el tiempo de respuesta suele ser
menor que en local. Las cifras de rendimiento varían ±3 puntos entre ejecuciones.

Mejoras aplicadas en la Fase 5: la foto principal se pide con prioridad alta, se quitó la
fuente cursiva (28 KB), mejor contraste del verde de WhatsApp, y Zod sin `eval` (evita una
infracción de la CSP en los formularios).
