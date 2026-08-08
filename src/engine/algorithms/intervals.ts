import type { Cell } from '../types';

export type Interval = [number, number];

/** Interval notation: `1-3, 6-9` or `[1,3] [6,9]`. */
export function parseIntervals(raw: string): Interval[] {
  const cleaned = String(raw).replace(/[[\]]/g, ' ');
  return cleaned
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chunk) => {
      const parts = chunk.split(/[-\s:]+/).filter(Boolean);
      if (parts.length !== 2) throw new Error(`"${chunk}" is not an interval like 1-3.`);
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (Number.isNaN(a) || Number.isNaN(b)) {
        throw new Error(`"${chunk}" must be two numbers.`);
      }
      if (b < a) throw new Error(`"${chunk}" ends before it starts.`);
      return [a, b] as Interval;
    });
}

/** How an interval is shown in a cell. */
export function show(iv: Interval): Cell {
  return `${iv[0]}–${iv[1]}`;
}

export function showAll(list: Interval[]): Cell[] {
  return list.map(show);
}
