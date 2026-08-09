import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function reverseString(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    [s[l], s[r]] = [s[r], s[l]];
    l++;
    r--;
  }
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');

  const t = new Tracer();
  const a = t.array('s', [...s], 's');

  yield t.note(1, { note: 'Swap the ends inward until the pointers meet.' });

  let l = 0;
  let r = a.length - 1;
  yield t.note(2, { vars: { l, r }, note: 'One pointer at each end.' });

  while (l < r) {
    yield t.swap(4, a, l, r, {
      note: `Swap '${a.at(r)}' and '${a.at(l)}'.`,
    });
    l++;
    r--;
    yield t.note(6, {
      vars: { l, r },
      note: l < r ? 'Step both pointers inward.' : 'The pointers have met.',
    });
  }

  yield t.settle(8, a, a.values.map((_, d) => d), {
    vars: { l: undefined, r: undefined, result: a.values.join('') },
    note: `Reversed in place: "${a.values.join('')}".`,
  });
}

export const reverseString: AlgorithmDef = {
  id: 'reverse-string',
  name: 'Reverse String',
  category: 'Two Pointers',
  code,
  inputFields: [{ key: 's', label: 's', kind: 'text', placeholder: 'hello' }],
  defaultInput: { s: 'hello' },
  run,
};
