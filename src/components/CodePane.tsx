import { useEffect, useMemo, useRef } from 'react';

interface Props {
  code: string;
  activeLine?: number;
}

export function CodePane({ code, activeLine }: Props) {
  const lines = useMemo(() => code.split('\n'), [code]);
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeLine]);

  return (
    <section className="panel panel--code">
      <header className="panel__head">
        <h2>code</h2>
      </header>
      <div className="code">
        {lines.map((line, idx) => {
          const n = idx + 1;
          const active = n === activeLine;
          return (
            <div
              key={n}
              ref={active ? activeRef : undefined}
              className={`code__line${active ? ' code__line--active' : ''}`}
            >
              <span className="code__gutter">{n}</span>
              <span className="code__text">{line === '' ? ' ' : line}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
