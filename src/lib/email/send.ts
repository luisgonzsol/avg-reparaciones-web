import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";

/**
 * Envío de emails con Resend. Configurable por variables de entorno:
 *   RESEND_API_KEY   clave de Resend (secreta, solo servidor)
 *   EMAIL_FROM       remitente, p. ej. "AVG Reparaciones <avisos@tudominio.com>"
 *   EMAIL_NOTIFY_TO  buzón de la empresa para los avisos (si falta, se usa el
 *                    email de Ajustes del panel)
 * Sin RESEND_API_KEY o EMAIL_FROM los emails se omiten (y se registra), para
 * que la web funcione igual en desarrollo.
 * Nunca se registran direcciones ni contenidos (datos personales).
 */
let client: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export type EmailMessage = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
  /** Etiqueta para los registros (sin datos personales). */
  tag: string;
};

export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.info(`[email] omitido (${msg.tag}): Resend no está configurado`);
    return false;
  }
  try {
    client ??= new Resend(process.env.RESEND_API_KEY);
    const [html, text] = await Promise.all([render(msg.react), render(msg.react, { plainText: true })]);
    const { error } = await client.emails.send({
      from: process.env.EMAIL_FROM!,
      to: msg.to,
      subject: msg.subject,
      html,
      text,
      replyTo: msg.replyTo,
    });
    if (error) throw new Error(`${error.name}: ${error.message}`);
    return true;
  } catch (e) {
    console.error(`[email] error (${msg.tag})`, e instanceof Error ? e.message : e);
    return false;
  }
}
