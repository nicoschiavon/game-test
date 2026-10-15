// Mapeo e.code (KeyboardEvent) → keyCode de Phaser — puro y testeable.
// Phaser usa nombres simples (T, UP, SPACE); e.code usa KeyT, Digit1, ArrowUp...

const DIGITS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const EXTRA = [
  'UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'ENTER', 'ESC', 'SHIFT', 'CTRL', 'ALT',
  'TAB', 'BACKSPACE', 'DELETE', 'HOME', 'END', 'PAGE_UP', 'PAGE_DOWN',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'NUMPAD_ZERO', 'NUMPAD_ONE', 'NUMPAD_TWO', 'NUMPAD_THREE', 'NUMPAD_FOUR',
  'NUMPAD_FIVE', 'NUMPAD_SIX', 'NUMPAD_SEVEN', 'NUMPAD_EIGHT', 'NUMPAD_NINE',
  'OPEN_BRACKET', 'CLOSED_BRACKET', 'SEMICOLON', 'QUOTES', 'BACKTICK', 'COMMA',
  'PERIOD', 'FORWARD_SLASH', 'BACK_SLASH', 'MINUS', 'PLUS', 'EQUALS',
];

const KNOWN = new Set([...LETTERS, ...EXTRA]);

const ALIASES: Record<string, string> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  Space: 'SPACE',
  Enter: 'ENTER',
  Escape: 'ESC',
  ShiftLeft: 'SHIFT',
  ShiftRight: 'SHIFT',
  ControlLeft: 'CTRL',
  ControlRight: 'CTRL',
  AltLeft: 'ALT',
  AltRight: 'ALT',
  Tab: 'TAB',
  Backspace: 'BACKSPACE',
};

/**
 * Resuelve un e.code al nombre de tecla de Phaser (o null si no mapeable).
 * La escena lo convierte con KeyCodes[nombre].
 */
export function phaserKeyName(code: string): string | null {
  let name: string | null = null;
  const single = /^Key([A-Z])$/.exec(code);
  if (single) name = single[1];
  const digit = /^Digit([0-9])$/.exec(code);
  if (digit) name = DIGITS[Number(digit[1])];
  if (!name && ALIASES[code]) name = ALIASES[code];
  if (!name && /^[A-Z0-9_]+$/.test(code)) name = code; // UP, SPACE, F1...
  return name && KNOWN.has(name) ? name : null;
}

/** Nombres válidos para mostrar/validar (coherente con settings). */
export function prettyKey(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5);
  return code;
}
