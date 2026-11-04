"use client";

/**
 * Error en el layout raíz: reemplaza todo el documento, así que no hay
 * estilos globales disponibles. Estilos mínimos en línea con la marca.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="es-VE">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#fafaf7",
          color: "#161616",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <title>Error · AVG Reparaciones</title>
        <main style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.2 }}>Algo no funcionó como esperábamos</h1>
          <p style={{ fontSize: 18, color: "#45443f" }}>
            Inténtalo de nuevo en unos segundos o escríbenos por WhatsApp al +58 412-7408970.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 16,
              minHeight: 52,
              padding: "0 28px",
              borderRadius: 999,
              border: 0,
              background: "#e31e24",
              color: "#fff",
              fontSize: 17,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
