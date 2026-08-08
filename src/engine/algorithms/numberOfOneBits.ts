import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { cellOf, syncBits, toBits } from './bits';

const WIDTH = 32;

const code = `function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  let n = input.n as number;
  if (!Number.isInteger(n) || n < 0 || n > 2147483647) {
    throw new Error('n must be an integer between 0 and 2147483647.');
  }

  const t = new Tracer();
  const bits = t.array('bits', toBits(n, WIDTH), `n in binary — bit ${WIDTH - 1} on the left`, []);
  t.setVars({ n });

  yield t.note(1, {
    note: 'n & (n − 1) clears exactly the lowest set bit, so the loop runs once per 1.',
  });

  let count = 0;
  yield t.note(2, { vars: { count }, note: 'No set bits counted yet.' });

  while (n !== 0) {
    const lowest = Math.log2(n & -n);
    const cell = cellOf(lowest, WIDTH);
    yield t.read(4, {
      i: cell,
      note: `The lowest 1 is at bit ${lowest}. Subtracting 1 flips it and everything below it.`,
    });

    n &= n - 1;
    const changed = syncBits(bits, n, WIDTH);
    count++;
    yield t.emit('write', 4, {
      indices: changed,
      vars: { n, count },
      note: `Cleared bit ${lowest} — ${count} one${count === 1 ? '' : 's'} counted so far.`,
    });
  }

  yield t.note(7, {
    vars: { result: count },
    note: `${count} set bit${count === 1 ? '' : 's'}.`,
  });
}

export const numberOfOneBits: AlgorithmDef = {
  id: 'number-of-one-bits',
  name: 'Number of 1 Bits',
  category: 'Bit Manipulation',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '11' }],
  defaultInput: { n: 11 },
  run,
};
