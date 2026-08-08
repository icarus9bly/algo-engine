import type { VarValue } from '../engine/types';

/**
 * Fallback for structures that don't declare their own pointers. Whitelisted
 * so a value like `target: 3` never gets mistaken for a position.
 */
const POINTER_VARS = new Set([
  'i', 'j', 'k', 'l', 'r', 'p', 'q',
  'left', 'right', 'lo', 'hi', 'mid', 'end', 'start',
  'slow', 'fast', 'read', 'write',
]);

/**
 * Which variables sit on which position of a structure. `declared` is the
 * structure's own list of pointer variables; `null` means fall back to the
 * whitelist, which is only safe when there's a single structure in play.
 */
export function pointersFor(
  vars: Record<string, VarValue>,
  length: number,
  declared: string[] | null,
): Map<number, string[]> {
  const allowed = declared === null ? POINTER_VARS : new Set(declared);
  const byIndex = new Map<number, string[]>();
  for (const [name, value] of Object.entries(vars)) {
    if (!allowed.has(name)) continue;
    if (typeof value !== 'number' || !Number.isInteger(value)) continue;
    if (value < 0 || value >= length) continue;
    const list = byIndex.get(value) ?? [];
    list.push(name);
    byIndex.set(value, list);
  }
  return byIndex;
}
