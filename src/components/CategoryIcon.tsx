import {
  Utensils, Coffee, Pizza, Wine, ShoppingCart, ShoppingBag,
  Car, Bus, Bike, Plane, Fuel,
  Home, Zap, Wifi, Phone, Droplets, Flame,
  Gamepad2, Music, Tv, Popcorn,
  Shirt, Scissors,
  Pill, Stethoscope, HeartPulse, Dumbbell,
  BookOpen, GraduationCap, Laptop,
  PawPrint, Baby, Gift,
  Wallet, TrendingUp, Building2, CreditCard,
  Wrench, Leaf, Globe, Star,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryIconDef {
  name: string;
  label: string;
  Icon: LucideIcon;
}

export const CATEGORY_ICONS: CategoryIconDef[] = [
  { name: 'Utensils',      label: 'Comida',          Icon: Utensils },
  { name: 'Coffee',        label: 'Café',            Icon: Coffee },
  { name: 'Pizza',         label: 'Pizza',           Icon: Pizza },
  { name: 'Wine',          label: 'Restaurante',     Icon: Wine },
  { name: 'ShoppingCart',  label: 'Supermercado',    Icon: ShoppingCart },
  { name: 'ShoppingBag',   label: 'Compras',         Icon: ShoppingBag },
  { name: 'Car',           label: 'Auto',            Icon: Car },
  { name: 'Bus',           label: 'Transporte',      Icon: Bus },
  { name: 'Bike',          label: 'Bicicleta',       Icon: Bike },
  { name: 'Plane',         label: 'Viajes',          Icon: Plane },
  { name: 'Fuel',          label: 'Combustible',     Icon: Fuel },
  { name: 'Home',          label: 'Hogar',           Icon: Home },
  { name: 'Zap',           label: 'Electricidad',    Icon: Zap },
  { name: 'Wifi',          label: 'Internet',        Icon: Wifi },
  { name: 'Phone',         label: 'Teléfono',        Icon: Phone },
  { name: 'Droplets',      label: 'Agua',            Icon: Droplets },
  { name: 'Flame',         label: 'Gas',             Icon: Flame },
  { name: 'Gamepad2',      label: 'Videojuegos',     Icon: Gamepad2 },
  { name: 'Music',         label: 'Música',          Icon: Music },
  { name: 'Tv',            label: 'Streaming',       Icon: Tv },
  { name: 'Popcorn',       label: 'Cine',            Icon: Popcorn },
  { name: 'Shirt',         label: 'Ropa',            Icon: Shirt },
  { name: 'Scissors',      label: 'Peluquería',      Icon: Scissors },
  { name: 'Pill',          label: 'Farmacia',        Icon: Pill },
  { name: 'Stethoscope',   label: 'Médico',          Icon: Stethoscope },
  { name: 'HeartPulse',    label: 'Salud',           Icon: HeartPulse },
  { name: 'Dumbbell',      label: 'Gym',             Icon: Dumbbell },
  { name: 'BookOpen',      label: 'Educación',       Icon: BookOpen },
  { name: 'GraduationCap', label: 'Universidad',     Icon: GraduationCap },
  { name: 'Laptop',        label: 'Tecnología',      Icon: Laptop },
  { name: 'PawPrint',      label: 'Mascotas',        Icon: PawPrint },
  { name: 'Baby',          label: 'Bebé',            Icon: Baby },
  { name: 'Gift',          label: 'Regalos',         Icon: Gift },
  { name: 'Wallet',        label: 'Salario',         Icon: Wallet },
  { name: 'TrendingUp',    label: 'Inversiones',     Icon: TrendingUp },
  { name: 'Building2',     label: 'Banco',           Icon: Building2 },
  { name: 'CreditCard',    label: 'Tarjeta',         Icon: CreditCard },
  { name: 'Wrench',        label: 'Reparaciones',    Icon: Wrench },
  { name: 'Leaf',          label: 'Naturaleza',      Icon: Leaf },
  { name: 'Globe',         label: 'Internacional',   Icon: Globe },
  { name: 'Star',          label: 'Especial',        Icon: Star },
];

const ICON_MAP = Object.fromEntries(CATEGORY_ICONS.map(i => [i.name, i.Icon])) as Record<string, LucideIcon>;

/** Returns true if the stored value is a Lucide icon name (e.g. "ShoppingCart") */
export const isLucideIconName = (value: string) => /^[A-Za-z][A-Za-z0-9]*$/.test(value);

interface CategoryIconProps {
  icon?: string;
  size?: number;
  className?: string;
}

/** Returns true if the stored value is an uploaded image (Cloudinary URL or data URI) */
export const isCustomImageIcon = (value: string) => value.startsWith('data:image') || value.startsWith('http');

/** Renders a Lucide icon, an uploaded image, or emoji text depending on the stored value. */
export default function CategoryIcon({ icon, size = 20, className = '' }: CategoryIconProps) {
  if (!icon) return null;
  if (isCustomImageIcon(icon)) {
    return <img src={icon} alt="" className={`object-cover rounded-full ${className}`} style={{ width: size, height: size }} />;
  }
  if (isLucideIconName(icon)) {
    const Icon = ICON_MAP[icon];
    if (Icon) return <Icon size={size} className={className} />;
  }
  // Fallback: emoji or custom text
  return <span className={`leading-none ${className}`} style={{ fontSize: size }}>{icon}</span>;
}
