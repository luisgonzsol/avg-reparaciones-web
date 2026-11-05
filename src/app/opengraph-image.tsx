import { ImageResponse } from "next/og";

/* Imagen que se ve al compartir la web en WhatsApp, Instagram, Facebook…
   Se genera en el build (sin fotos de terceros). Cuando llegue el logo
   oficial, se puede sustituir por un archivo opengraph-image.png. */

export const alt = "AVG Reparaciones C.A. · Reparación de electrodomésticos en Caracas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#fafaf7",
        color: "#161616",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#e31e24",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 800,
          }}
        >
          AVG
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>AVG Reparaciones C.A.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>
          Reparación de electrodomésticos y embobinado de motores
        </div>
        <div style={{ fontSize: 30, color: "#45443f" }}>
          Repuestos con envío a toda Venezuela · Más de 20 años en Caracas
        </div>
      </div>
      <div style={{ display: "flex", height: 12, width: "100%" }}>
        <div style={{ flex: 3, background: "#e31e24" }} />
        <div style={{ flex: 1, background: "#ffc20e" }} />
        <div style={{ flex: 1, background: "#f57c20" }} />
      </div>
    </div>,
    size,
  );
}
