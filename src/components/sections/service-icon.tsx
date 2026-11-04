import type { ServiceIcon as IconName } from "@/content/services";
import { IconCoil, IconFactory, IconHome, IconPackage } from "@/components/ui/icons";

const ICONS = { home: IconHome, coil: IconCoil, industrial: IconFactory, parts: IconPackage } as const;

export function ServiceIcon({ name, size = 28 }: { name: IconName; size?: number }) {
  const Icon = ICONS[name];
  return <Icon size={size} />;
}
