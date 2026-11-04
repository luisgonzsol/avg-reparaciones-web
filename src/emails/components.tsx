/**
 * Piezas comunes de los emails. HTML de email "a la antigua" (tablas y
 * estilos en línea) para que se vea bien en Gmail, Outlook y móviles.
 * Se renderiza a HTML con @react-email/render (src/lib/email/send.ts).
 * React escapa todo el texto: los datos de clientes nunca se interpretan
 * como HTML.
 */
import type { CSSProperties, ReactNode } from "react";

export const colors = {
  // Mismos valores que los tokens de src/app/globals.css.
  brand: "#e31e24",
  ink: "#161616",
  soft: "#45443f",
  muted: "#64625b",
  line: "#e4e2da",
  canvas: "#fafaf7",
  sand: "#f2f1ec",
};

const font = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function EmailLayout({
  preview,
  children,
  footer,
}: {
  preview: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <html lang="es">
      {/* HTML de email, no una página de Next: <head> es correcto aquí. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
      </head>
      <body style={{ margin: 0, padding: 0, background: colors.canvas, fontFamily: font, color: colors.ink }}>
        {/* Texto de vista previa (bandeja de entrada) */}
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>{preview}</div>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ background: colors.canvas }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "24px 12px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    maxWidth: 560,
                    background: "#ffffff",
                    borderRadius: 16,
                    border: `1px solid ${colors.line}`,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "22px 28px", borderBottom: `4px solid ${colors.brand}` }}>
                        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>
                          AVG <span style={{ color: colors.brand }}>Reparaciones</span>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "28px 28px 8px", fontSize: 16, lineHeight: 1.55 }}>{children}</td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "16px 28px 26px",
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: colors.muted,
                        }}
                      >
                        {footer ?? (
                          <>
                            AVG Reparaciones C.A. · RIF J-504740098 · Caracas, Venezuela
                            <br />
                            Este es un mensaje automático. Si tienes dudas, escríbenos por WhatsApp.
                          </>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 style={{ margin: "0 0 12px", fontSize: 24, lineHeight: 1.25, fontWeight: 800 }}>{children}</h1>;
}

export function P({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ margin: "0 0 14px", color: colors.soft, ...style }}>{children}</p>;
}

export function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "8px 0 20px" }}>
      <tbody>
        <tr>
          <td style={{ background: colors.brand, borderRadius: 999 }}>
            <a
              href={href}
              style={{
                display: "inline-block",
                padding: "13px 24px",
                color: "#ffffff",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Tabla de datos "etiqueta: valor". Los valores vacíos no se muestran. */
export function Details({ rows }: { rows: [string, ReactNode | null | undefined][] }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ margin: "6px 0 18px", background: colors.sand, borderRadius: 12 }}
    >
      <tbody>
        {rows
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([label, value]) => (
            <tr key={label}>
              <td
                style={{
                  padding: "8px 14px",
                  color: colors.muted,
                  fontSize: 14,
                  width: "38%",
                  verticalAlign: "top",
                }}
              >
                {label}
              </td>
              <td style={{ padding: "8px 14px", fontSize: 15, fontWeight: 600, whiteSpace: "pre-line" }}>
                {value}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

export type EmailItem = { name: string; sku: string; quantity: number; lineTotal: string };

export function ItemsTable({
  items,
  total,
  totalBs,
}: {
  items: EmailItem[];
  total: string;
  totalBs: string;
}) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "6px 0 18px" }}>
      <tbody>
        {items.map((i) => (
          <tr key={i.sku}>
            <td style={{ padding: "9px 0", borderBottom: `1px solid ${colors.line}`, fontSize: 15 }}>
              {i.quantity} × {i.name}
              <br />
              <span style={{ fontSize: 12, color: colors.muted }}>SKU {i.sku}</span>
            </td>
            <td
              align="right"
              style={{
                padding: "9px 0",
                borderBottom: `1px solid ${colors.line}`,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {i.lineTotal}
            </td>
          </tr>
        ))}
        <tr>
          <td style={{ paddingTop: 12, fontWeight: 700 }}>Total</td>
          <td align="right" style={{ paddingTop: 12, fontWeight: 800, fontSize: 18 }}>
            {total}
          </td>
        </tr>
        <tr>
          <td style={{ fontSize: 13, color: colors.muted }}>Referencia en Bs</td>
          <td align="right" style={{ fontSize: 13, color: colors.muted }}>
            {totalBs}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
