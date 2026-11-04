import clsx from "clsx";
import { AVAILABILITY_LABEL, availabilityOf } from "@/lib/catalog";

const STYLE = {
  available: "bg-success-soft text-success",
  low: "bg-warning-soft text-warning",
  out: "bg-sand text-muted",
} as const;

export function AvailabilityBadge({
  available,
  lowStockThreshold,
  className,
}: {
  available: number;
  lowStockThreshold: number;
  className?: string;
}) {
  const a = availabilityOf({ available, lowStockThreshold });
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", STYLE[a], className)}>
      {AVAILABILITY_LABEL[a]}
    </span>
  );
}
