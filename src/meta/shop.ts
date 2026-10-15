// Tienda de mejoras permanentes — DATOS + costes puros.

export interface ShopDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
}

export const SHOP: ShopDef[] = [
  { id: 'filo', name: 'Filo', desc: '+4 % daño', maxLevel: 5, baseCost: 50, costGrowth: 1.8 },
  { id: 'botas', name: 'Botas', desc: '+3 % velocidad', maxLevel: 5, baseCost: 50, costGrowth: 1.8 },
  { id: 'corazon', name: 'Corazón', desc: '+10 vida máx.', maxLevel: 5, baseCost: 60, costGrowth: 1.8 },
  { id: 'avaricia', name: 'Avaricia', desc: '+5 % almas', maxLevel: 5, baseCost: 40, costGrowth: 2.0 },
];

export function shopDef(id: string): ShopDef {
  const def = SHOP.find((s) => s.id === id);
  if (!def) throw new Error(`Mejora de tienda desconocida: ${id}`);
  return def;
}

/** Coste del siguiente nivel (level = nivel actual, 0-based). */
export function shopCost(def: ShopDef, level: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, level));
}
