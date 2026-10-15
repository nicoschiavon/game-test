// Personajes jugables — DATOS puros.

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  tex: string;
  dmgMul: number;
  speedMul: number;
  maxHp: number;
  startWeapon: string;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'caballero', name: 'Caballero', title: 'Equilibrado', tex: 'player', dmgMul: 1, speedMul: 1, maxHp: 100, startWeapon: 'daga' },
  { id: 'maga', name: 'Maga', title: 'Cañón de cristal', tex: 'player-mage', dmgMul: 1.2, speedMul: 1, maxHp: 80, startWeapon: 'orbes' },
  { id: 'barbaro', name: 'Bárbaro', title: 'Muro con piernas', tex: 'player-barbaro', dmgMul: 1.1, speedMul: 0.92, maxHp: 140, startWeapon: 'hoguera' },
];

export function characterDef(id: string): CharacterDef {
  const def = CHARACTERS.find((c) => c.id === id);
  if (!def) throw new Error(`Personaje desconocido: ${id}`);
  return def;
}
