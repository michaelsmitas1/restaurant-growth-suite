import {
  UtensilsCrossed, Utensils, ChefHat, Beef, Beer, Wine, Martini,
  Coffee, Bean, CupSoda, Pizza, Sandwich, Drumstick,
  type LucideIcon,
} from 'lucide-react';

// Presets de ícone de selo por categoria (spec-010, Passo 1b). lucide-react
// não tem ícone de hambúrguer/taco — Beef/Drumstick são a aproximação mais
// próxima disponível.
export const STAMP_ICON_SEGMENTS = ['restaurante', 'bar', 'cafeteria', 'lanchonete'] as const;
export type StampIconSegment = (typeof STAMP_ICON_SEGMENTS)[number];

export interface StampIconPreset {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const STAMP_ICON_PRESETS: Record<StampIconSegment, StampIconPreset[]> = {
  restaurante: [
    { id: 'plate', label: 'Prato', icon: UtensilsCrossed },
    { id: 'fork', label: 'Talher', icon: Utensils },
    { id: 'chef', label: 'Chef', icon: ChefHat },
    { id: 'meat', label: 'Carne', icon: Beef },
  ],
  bar: [
    { id: 'mug', label: 'Caneca', icon: Beer },
    { id: 'wine', label: 'Taça', icon: Wine },
    { id: 'cocktail', label: 'Drinque', icon: Martini },
  ],
  cafeteria: [
    { id: 'cup', label: 'Xícara', icon: Coffee },
    { id: 'bean', label: 'Grão', icon: Bean },
    { id: 'iced', label: 'Gelado', icon: CupSoda },
  ],
  lanchonete: [
    { id: 'burger', label: 'Hambúrguer', icon: Beef },
    { id: 'pizza', label: 'Pizza', icon: Pizza },
    { id: 'sandwich', label: 'Sanduíche', icon: Sandwich },
    { id: 'taco', label: 'Taco', icon: Drumstick },
  ],
};

const DEFAULT_PRESET = STAMP_ICON_PRESETS.restaurante[0];
const ALL_PRESETS = Object.values(STAMP_ICON_PRESETS).flat();

export function findStampIconPreset(id: string | null | undefined): StampIconPreset {
  return ALL_PRESETS.find(p => p.id === id) ?? DEFAULT_PRESET;
}

// Segmento vem de restaurants.segment (texto livre, Passo 1) — cai no
// conjunto "restaurante" quando não bate com nenhuma categoria conhecida.
export function presetsForSegment(segment: string | null | undefined): StampIconPreset[] {
  const normalized = (segment ?? '').toLowerCase();
  const match = STAMP_ICON_SEGMENTS.find(s => s === normalized);
  return STAMP_ICON_PRESETS[match ?? 'restaurante'];
}
