import {
  Baby,
  Bus,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { LUCIDE_PREFIX, type CategoryIconName } from "./shared";

// El tipo Record obliga a mantener este mapa sincronizado con CATEGORY_ICONS.
export const LUCIDE_ICONS: Record<CategoryIconName, LucideIcon> = {
  Utensils,
  ShoppingCart,
  Coffee,
  Car,
  Bus,
  Fuel,
  House,
  Zap,
  Wifi,
  Smartphone,
  HeartPulse,
  Pill,
  GraduationCap,
  Gamepad2,
  Film,
  Shirt,
  CreditCard,
  Landmark,
  PiggyBank,
  Gift,
  PawPrint,
  Baby,
  Dumbbell,
  Plane,
};

type Props = { icon?: string | null; color: string; size?: number };

/** Ícono de la categoría teñido con su color; sin ícono, muestra el punto de color. */
export default function CategoryIcon({ icon, color, size = 16 }: Props) {
  if (icon?.startsWith("data:")) {
    // Siempre como <img>: un SVG subido nunca se inyecta en el DOM. next/image no aporta nada con data URLs.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt=""
        aria-hidden
        width={size}
        height={size}
        className="shrink-0 rounded-sm object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  const Icon = icon?.startsWith(LUCIDE_PREFIX)
    ? LUCIDE_ICONS[icon.slice(LUCIDE_PREFIX.length) as CategoryIconName]
    : undefined;
  if (Icon) return <Icon aria-hidden size={size} color={color} className="shrink-0" />;

  const dot = Math.round(size * 0.6);
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ backgroundColor: color, width: dot, height: dot }}
    />
  );
}
