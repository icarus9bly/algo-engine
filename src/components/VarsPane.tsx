import type { VarValue } from '../engine/types';

interface Props {
  vars: Record<string, VarValue>;
}

function isRecord(v: VarValue): v is Record<string, string | number> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function Value({ value }: { value: VarValue }) {
  if (Array.isArray(value)) {
    return (
      <span className="val val--list">
        [{value.map((v) => String(v)).join(', ')}]
      </span>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="val val--empty">{'{}'}</span>;
    return (
      <span className="val val--map">
        {entries.map(([k, v]) => (
          <span className="chip" key={k}>
            <span className="chip__key">{k}</span>
            <span className="chip__arrow">→</span>
            <span className="chip__val">{String(v)}</span>
          </span>
        ))}
      </span>
    );
  }

  if (value === null) return <span className="val val--empty">null</span>;
  if (typeof value === 'boolean') {
    return <span className={`val val--bool val--${value}`}>{String(value)}</span>;
  }
  return <span className="val">{String(value)}</span>;
}

export function VarsPane({ vars }: Props) {
  const entries = Object.entries(vars);

  return (
    <section className="panel panel--vars">
      <header className="panel__head">
        <h2>variables</h2>
      </header>
      {entries.length === 0 ? (
        <p className="empty">No variables in scope.</p>
      ) : (
        <dl className="vars">
          {entries.map(([name, value]) => (
            <div className="vars__row" key={name}>
              <dt>{name}</dt>
              <dd>
                <Value value={value} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
