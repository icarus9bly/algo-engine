import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { cellOf, syncBits, toBits } from './bits';

const WIDTH = 32;

const code = `function reverseBits(n) {
  let res = 0;
  for (let i = 0; i < 32; i++) {
    const bit = (n >>> i) & 1;
    res |= bit << (31 - i);
  }
  return res >>> 0;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  if (!Number.isInteger(n) || n < 0 || n > 4294967295) {
    throw new Error('n must be an integer between 0 and 4294967295.');
  }

  const t = new Tracer();
  const src = t.array('n', toBits(n, WIDTH), 'n — bit 31 on the left', []);
  const out = t.array('res', toBits(0, WIDTH), 'res — bit 31 on the left', []);
  t.setVars({ n });

  yield t.note(1, { note: 'Bit i of the input becomes bit 31 − i of the output.' });

  let res = 0;
  for (let i = 0; i < WIDTH; i++) {
    const bit = (n >>> i) & 1;
    const from = cellOf(i, WIDTH);
    const to = cellOf(WIDTH - 1 - i, WIDTH);

    yield t.read(4, {
      target: src,
      i: from,
      vars: { i, bit },
      note: `Bit ${i} of n is ${bit}.`,
    });

    if (bit === 1) {
      res = (res | (bit << (WIDTH - 1 - i))) >>> 0;
      syncBits(out, res, WIDTH);
      yield t.emit('write', 5, {
        target: out,
        i: to,
        vars: { res },
        note: `Set bit ${WIDTH - 1 - i} of res.`,
      });
    } else {
      yield t.note(5, {
        target: out,
        i: to,
        note: `Bit ${WIDTH - 1 - i} of res stays 0.`,
      });
    }
  }

  yield t.settle(7, out, out.values.map((_, d) => d), {
    vars: { i: undefined, bit: undefined, result: res },
    note: `Reversed: ${res}.`,
  });
}

export const reverseBits: AlgorithmDef = {
  id: 'reverse-bits',
  name: 'Reverse Bits',
  category: 'Bit Manipulation',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '43261596' }],
  defaultInput: { n: 43261596 },
  run,
};
