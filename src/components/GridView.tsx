import type { AlgoEvent, Cell, GridStructure } from '../engine/types';
import { pointersFor } from './pointers';

interface Props {
  structure: GridStructure;
  event: AlgoEvent | null;
  active: boolean;
}

function formatCell(value: Cell): string {
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '−∞';
  return String(value);
}

/**
 * A plain CSS-grid of cells. Positions come in as flat indices, the same
 * numeric addressing every other renderer uses, so highlighting needs no
 * special handling here.
 */
export function GridView({ structure, event, active }: Props) {
  const { rows, cols, cells } = structure;

  if (rows === 0 || cols === 0) {
    return (
      <div className="grid-block">
        <div className="array__label">{structure.label}</div>
        <p className="empty">empty grid</p>
      </div>
    );
  }

  const highlighted = new Set<number>();
  if (active && event) {
    if (event.i !== undefined) highlighted.add(event.i);
    if (event.j !== undefined) highlighted.add(event.j);
    for (const idx of event.indices ?? []) highlighted.add(idx);
  }

  const settled = new Set(structure.settled);
  const pointers = event
    ? pointersFor(event.vars, cells.length, structure.pointerNames)
    : new Map<number, string[]>();

  return (
    <div className="grid-block">
      <div className="array__label">{structure.label}</div>
      <div className="grid__scroll">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(34px, auto))` }}
        >
          {cells.map((value, idx) => {
            const role = highlighted.has(idx)
              ? event!.type
              : settled.has(idx)
                ? 'settled'
                : 'idle';
            const names = pointers.get(idx) ?? [];
            return (
              <div className={`gcell gcell--${role}`} key={idx}>
                <span className="gcell__value">{formatCell(value)}</span>
                {names.length > 0 && (
                  <span className="gcell__pointer">{names.join(' ')}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
