/**
 * Zod configurado para la web. Importa SIEMPRE `z` desde aquí, no desde "zod".
 *
 * `jitless`: Zod intenta compilar los esquemas con `new Function()`; nuestra
 * CSP (sin 'unsafe-eval') lo bloquea y el navegador registra una infracción.
 * Sin JIT valida igual, sin intentarlo.
 */
import { z } from "zod";

z.config({ jitless: true });

export { z };
