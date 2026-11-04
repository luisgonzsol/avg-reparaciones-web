import { connection } from "next/server";
import { getSiteSettings } from "@/lib/settings";
import clsx from "clsx";
import { describeStatus, getOpenStatus, zonedNow } from "@/lib/schedule";

/**
 * Indicador "Abierto ahora / Cerrado". Se calcula en el SERVIDOR con la hora
 * de Caracas en cada petición, sin depender del reloj del dispositivo.
 */
export async function OpenStatus({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  await connection(); // fuerza el cálculo en cada petición
  const cfg = await getSiteSettings();
  const now = new Date();
  const status = getOpenStatus(cfg.schedule, now, cfg.timeZone);
  const { day } = zonedNow(now, cfg.timeZone);
  const text = describeStatus(status, day);

  return (
    <p
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold",
        status.isOpen
          ? tone === "dark"
            ? "bg-success/25 text-[#9be3b6]"
            : "bg-success-soft text-success"
          : tone === "dark"
            ? "bg-white/10 text-white/85"
            : "bg-sand text-ink-soft",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx("relative size-2.5 rounded-full", status.isOpen ? "bg-[#22a35a]" : "bg-muted")}
      >
        {status.isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#22a35a] motion-safe:animate-ping" />
        )}
      </span>
      {text}
    </p>
  );
}
