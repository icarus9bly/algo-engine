/**
 * Grid input notation: rows separated by `;` or a newline. Within a row,
 * comma/space separated tokens become cells; a bare run of characters
 * (`11010`, `ABCE`) becomes one cell per character.
 */
export function parseGrid(raw: string): string[][] {
  const rows = String(raw)
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const cells = rows.map((row) =>
    /[\s,]/.test(row) ? row.split(/[\s,]+/).filter(Boolean) : [...row],
  );

  if (cells.length === 0) return [];
  const width = cells[0].length;
  if (cells.some((row) => row.length !== width)) {
    throw new Error('Every row must have the same number of cells.');
  }
  return cells;
}

export function parseNumberGrid(raw: string): number[][] {
  const cells = parseGrid(raw);
  return cells.map((row) =>
    row.map((tok) => {
      const v = Number(tok);
      if (Number.isNaN(v)) throw new Error(`"${tok}" is not a number.`);
      return v;
    }),
  );
}

/** Guards against a grid so large the run is unusable. */
export function checkSize(rows: number, cols: number, max = 64): void {
  if (rows === 0 || cols === 0) throw new Error('The grid is empty.');
  if (rows * cols > max) {
    throw new Error(`Keep the grid to ${max} cells or fewer (this one has ${rows * cols}).`);
  }
}
