import type { TracedArray } from '../tracer';
import type { Cell } from '../types';

/** A value as an array of '0'/'1' cells, most significant bit first. */
export function toBits(value: number, width: number): Cell[] {
  const cells: Cell[] = [];
  for (let pos = width - 1; pos >= 0; pos--) {
    cells.push(((value >>> pos) & 1) === 1 ? '1' : '0');
  }
  return cells;
}

/**
 * Cell index of bit `pos` (counted from the least significant end) in a
 * `width`-wide row rendered most significant bit first.
 */
export function cellOf(pos: number, width: number): number {
  return width - 1 - pos;
}

/** Rewrites a bit row in place; returns the cells that actually changed. */
export function syncBits(arr: TracedArray, value: number, width: number): number[] {
  const next = toBits(value, width);
  const changed: number[] = [];
  for (let i = 0; i < width; i++) {
    if (arr.at(i) !== next[i]) {
      arr.set(i, next[i]);
      changed.push(i);
    }
  }
  return changed;
}
