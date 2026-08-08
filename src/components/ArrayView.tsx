import type { AlgoEvent, ArrayStructure, Cell } from '../engine/types';
import { pointersFor } from './pointers';

interface Props {
  structure: ArrayStructure;
  event: AlgoEvent | null;
  /** Whether this is the structure the event's positions refer to. */
  active: boolean;
}

/** `Infinity` is a normal DP seed value; spelling it out blows the cell open. */
function formatCell(value: Cell): string {
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '−∞';
  return String(value);
}

export function ArrayView({ structure, event, active }: Props) {
  const highlighted = new Set<number>();
  if (active && event) {
    if (event.i !== undefined) highlighted.add(event.i);
    if (event.j !== undefined) highlighted.add(event.j);
    for (const idx of event.indices ?? []) highlighted.add(idx);
  }

  const settled = new Set(structure.settled);
  const numeric = structure.values.every((v) => typeof v === 'number');
  // DP tables seed cells with Infinity; it must not swallow the bar scale.
  const finite = structure.values.filter(
    (v) => typeof v === 'number' && Number.isFinite(v),
  ) as number[];
  const max = Math.max(1, ...finite.map(Math.abs));
  // Pointers are drawn by ownership, not by which structure the current event
  // targets: `i` still points into the string while we're pushing to a stack.
  const pointers: Map<number, string[]> = event
    ? pointersFor(event.vars, structure.values.length, structure.pointerNames)
    : new Map();

  return (
    <div className="array">
      <div className="array__label">{structure.label}</div>
      <div className="array__cells">
        {structure.values.map((value, idx) => {
          const hit = highlighted.has(idx);
          const role = hit ? event!.type : settled.has(idx) ? 'settled' : 'idle';
          const fill = numeric
            ? Math.min(100, Math.max(6, (Math.abs(value as number) / max) * 100))
            : 0;
          return (
            <div className="cell-stack" key={idx}>
              <div className={`cell cell--${role}`}>
                <span className="cell__value">{formatCell(value)}</span>
                {numeric && <span className="cell__bar" style={{ width: `${fill}%` }} />}
              </div>
              <div className="cell__index">{idx}</div>
              <div className="cell__pointers">
                {(pointers.get(idx) ?? []).map((name) => (
                  <span className="pointer" key={name}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {structure.values.length === 0 && <p className="empty">empty</p>}
      </div>
    </div>
  );
}
