// Mapa de iconos predefinidos y visualización de iconos de categoría.
// Cliente y servidor pueden importarlo; no depende de Prisma.
import {
  Book,
  Car,
  Coffee,
  Dog,
  Dumbbell,
  Film,
  Fuel,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Phone,
  Plane,
  ShoppingCart,
  Shirt,
  Stethoscope,
  Utensils,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORY_ICON_NAMES,
  ICON_ACCEPTED_MIME_TYPES,
  ICON_MAX_BYTES,
  type CategoryIconName,
} from "./shared";

export const CATEGORY_ICON_COMPONENTS: Record<CategoryIconName, LucideIcon> = {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Heart,
  Plane,
  Gift,
  Book,
  Coffee,
  Shirt,
  Fuel,
  Phone,
  Film,
  Wallet,
  Stethoscope,
  GraduationCap,
  Dumbbell,
  Dog,
  Wrench,
};

export const CATEGORY_ICON_LABELS: Record<CategoryIconName, string> = {
  ShoppingCart: "Compras",
  Utensils: "Comida",
  Car: "Coche",
  Home: "Casa",
  Zap: "Servicios",
  Heart: "Salud y cuidado",
  Plane: "Viajes",
  Gift: "Regalos",
  Book: "Libros",
  Coffee: "Café",
  Shirt: "Ropa",
  Fuel: "Combustible",
  Phone: "Teléfono",
  Film: "Entretenimiento",
  Wallet: "Dinero",
  Stethoscope: "Médico",
  GraduationCap: "Educación",
  Dumbbell: "Gimnasio",
  Dog: "Mascotas",
  Wrench: "Mantenimiento",
};

export function isCategoryIconName(value: string): value is CategoryIconName {
  return (CATEGORY_ICON_NAMES as readonly string[]).includes(value);
}

/**
 * Comprobación rápida en el navegador antes de leer el archivo.
 * La validación definitiva se hace en el servidor (lib/categories.ts).
 * Devuelve un mensaje de error o null si el archivo parece válido.
 */
export function checkIconFileInBrowser(file: File): string | null {
  if (!(ICON_ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "El archivo debe ser una imagen PNG, JPG, SVG o WEBP.";
  }
  if (file.size > ICON_MAX_BYTES) {
    return "El icono no puede superar 100 KB.";
  }
  return null;
}

/** Icono de categoría: el personalizado tiene prioridad sobre el predefinido. */
export function CategoryIcon({
  icon,
  iconData,
  color,
  className,
}: {
  icon: string | null;
  iconData: string | null;
  color: string;
  className?: string;
}) {
  if (iconData) {
    // eslint-disable-next-line @next/next/no-img-element -- data URL, no optimización
    return <img src={iconData} alt="" className={className} />;
  }
  if (icon && isCategoryIconName(icon)) {
    const Icon = CATEGORY_ICON_COMPONENTS[icon];
    return <Icon aria-hidden className={className} style={{ color }} />;
  }
  return null;
}
