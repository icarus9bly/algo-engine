import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function mergeTriplets(triplets, target) {
  const good = new Set();
  for (const [a, b, c] of triplets) {
    if (a > target[0] || b > target[1] || c > target[2]) continue;
    if (a === target[0]) good.add(0);
    if (b === target[1]) good.add(1);
    if (c === target[2]) good.add(2);
  }
  return good.size === 3;
}`;

function parseTriplets(raw: string): number[][] {
  return String(raw)
    .split(/[;\n|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chunk) => {
      const parts = chunk.split(/[\s,]+/).filter(Boolean).map(Number);
      if (parts.length !== 3 || parts.some(Number.isNaN)) {
        throw new Error(`"${chunk}" is not a triplet like 2,5,3.`);
      }
      return parts;
    });
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const triplets = parseTriplets(String(input.triplets ?? ''));
  const target = parseTriplets(String(input.target ?? ''))[0];
  if (!target) throw new Error('Give a target triplet like 2,7,5.');

  const t = new Tracer();
  const rows = t.array(
    'triplets',
    triplets.map((tr) => tr.join(',')),
    'triplets',
    ['i'],
  );
  t.array('target', target, 'target', []);

  yield t.note(1, {
    note: 'Merging takes the maximum of each position, so any triplet that overshoots the target anywhere can never be used — and the rest are all safe to merge.',
  });

  const good = new Set<number>();
  yield t.note(2, { target: rows, vars: { good: [] }, note: 'Track which positions have been matched exactly.' });

  for (let i = 0; i < triplets.length; i++) {
    const [x, y, z] = triplets[i];
    const overshoots = x > target[0] || y > target[1] || z > target[2];
    yield t.compare(4, {
      target: rows,
      i,
      vars: { i },
      note: overshoots
        ? `(${x},${y},${z}) exceeds the target somewhere — including it would push a position too high.`
        : `(${x},${y},${z}) stays within the target everywhere, so it is safe to merge.`,
    });

    if (overshoots) continue;

    const hits: number[] = [];
    if (x === target[0]) hits.push(0);
    if (y === target[1]) hits.push(1);
    if (z === target[2]) hits.push(2);
    for (const h of hits) good.add(h);

    yield t.note(7, {
      target: rows,
      i,
      vars: { good: [...good].sort() },
      note: hits.length === 0
        ? 'It matches no position exactly, so it adds nothing.'
        : `It nails position${hits.length === 1 ? '' : 's'} ${hits.join(', ')}.`,
    });
  }

  const ok = good.size === 3;
  yield t.note(9, {
    target: rows,
    vars: { i: undefined, result: ok },
    note: ok
      ? 'All three positions can be hit exactly, so the target is reachable.'
      : `Only position${good.size === 1 ? '' : 's'} ${[...good].sort().join(', ') || 'none'} can be matched.`,
  });
}

export const mergeTriplets: AlgorithmDef = {
  id: 'merge-triplets',
  name: 'Merge Triplets to Form Target Triplet',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'triplets', label: 'triplets (; separated)', kind: 'text', placeholder: '2,5,3; 1,8,4; 1,7,5' },
    { key: 'target', label: 'target', kind: 'text', placeholder: '2,7,5' },
  ],
  defaultInput: { triplets: '2,5,3; 1,8,4; 1,7,5', target: '2,7,5' },
  run,
};
