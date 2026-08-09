import { Tracer, mapToRecord } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function partitionLabels(s) {
  const last = {};
  for (let i = 0; i < s.length; i++) last[s[i]] = i;
  const res = [];
  let size = 0, end = 0;
  for (let i = 0; i < s.length; i++) {
    size++;
    end = Math.max(end, last[s[i]]);
    if (i === end) {
      res.push(size);
      size = 0;
    }
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');

  const t = new Tracer();
  t.array('s', [...s], 's', ['i', 'end']);
  const out = t.array('res', [], 'partition sizes', []);

  yield t.note(1, {
    note: 'A partition can only close once every letter inside it has had its last occurrence.',
  });

  const last = new Map<string, number>();
  for (let i = 0; i < s.length; i++) last.set(s[i], i);
  yield t.note(3, {
    vars: { last: mapToRecord(last as Map<string, number>) },
    note: 'First record where each letter appears for the last time.',
  });

  let size = 0;
  let end = 0;
  yield t.note(5, { target: out, vars: { size, end }, note: 'Start the first partition.' });

  for (let i = 0; i < s.length; i++) {
    size++;
    const lastHere = last.get(s[i])!;
    const grew = lastHere > end;
    end = Math.max(end, lastHere);
    yield t.read(8, {
      i,
      vars: { i, end, size },
      note: grew
        ? `'${s[i]}' reappears at ${lastHere}, so the partition must stretch that far.`
        : `'${s[i]}' has no later occurrence past ${end}.`,
    });

    if (i === end) {
      yield t.found(9, {
        indices: Array.from({ length: size }, (_, d) => i - size + 1 + d),
        note: `Index ${i} is the furthest any letter inside reaches — close the partition here.`,
      });
      yield t.push(10, out, size, { note: `That partition holds ${size} character${size === 1 ? '' : 's'}.` });
      size = 0;
    }
  }

  yield t.settle(14, out, out.values.map((_, d) => d), {
    vars: { i: undefined, size: undefined, end: undefined, result: out.values.join(',') },
    note: `Partition sizes: ${out.values.join(', ')}.`,
  });
}

export const partitionLabels: AlgorithmDef = {
  id: 'partition-labels',
  name: 'Partition Labels',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'ababcbacadefegdehijhklij' },
  ],
  defaultInput: { s: 'ababcbacadefegde' },
  run,
};
