import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { cellOf, syncBits, toBits } from './bits';

const WIDTH = 16;

const code = `function minEnd(n, x) {
  let res = x;
  let remaining = n - 1;
  let bit = 0;
  while (remaining > 0) {
    if (((x >> bit) & 1) === 0) {
      if (remaining & 1) res |= 1 << bit;
      remaining >>= 1;
    }
    bit++;
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  const x = input.x as number;
  if (!Number.isInteger(n) || n < 1) throw new Error('n must be a positive integer.');
  if (!Number.isInteger(x) || x < 0 || x > 65535) throw new Error('x must be between 0 and 65535.');

  const t = new Tracer();
  const xb = t.array('x', toBits(x, WIDTH), 'x in binary', []);
  const rb = t.array('res', toBits(x, WIDTH), 'res in binary', []);

  yield t.note(1, {
    note: `Every one of the ${n} values must contain all of x's set bits, so those are fixed. The free bits count upward, and the last value uses the count ${n - 1}.`,
  });

  let res = x;
  let remaining = n - 1;
  let bit = 0;
  yield t.note(3, {
    vars: { res, remaining },
    note: `Distribute ${remaining} across the zero bits of x, lowest first.`,
  });

  while (remaining > 0 && bit < WIDTH) {
    const free = ((x >> bit) & 1) === 0;
    const cell = cellOf(bit, WIDTH);

    if (!free) {
      yield t.compare(5, {
        target: xb,
        i: cell,
        vars: { bit },
        note: `Bit ${bit} is already set in x, so it is not ours to use.`,
      });
    } else {
      const take = remaining & 1;
      if (take) {
        res |= 1 << bit;
        syncBits(rb, res, WIDTH);
        yield t.emit('write', 6, {
          target: rb,
          i: cell,
          vars: { res, remaining: remaining >> 1 },
          note: `Bit ${bit} is free and the counter wants a 1 here — set it. res is now ${res}.`,
        });
      } else {
        yield t.note(6, {
          target: rb,
          i: cell,
          vars: { remaining: remaining >> 1 },
          note: `Bit ${bit} is free but the counter wants a 0 here — leave it.`,
        });
      }
      remaining >>= 1;
    }

    bit++;
  }

  yield t.settle(10, rb, rb.values.map((_, d) => d), {
    vars: { bit: undefined, remaining: undefined, result: res },
    note: `The largest of the ${n} values is ${res}.`,
  });
}

export const minimumArrayEnd: AlgorithmDef = {
  id: 'minimum-array-end',
  name: 'Minimum Array End',
  category: 'Bit Manipulation',
  code,
  inputFields: [
    { key: 'n', label: 'n', kind: 'number', placeholder: '3' },
    { key: 'x', label: 'x', kind: 'number', placeholder: '4' },
  ],
  defaultInput: { n: 3, x: 4 },
  run,
};
