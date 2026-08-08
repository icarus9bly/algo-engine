import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function countBits(n) {
  const dp = new Array(n + 1).fill(0);
  let offset = 1;
  for (let i = 1; i <= n; i++) {
    if (offset * 2 === i) offset = i;
    dp[i] = 1 + dp[i - offset];
  }
  return dp;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  if (!Number.isInteger(n) || n < 0) throw new Error('n must be a non-negative integer.');
  if (n > 32) throw new Error('Keep n at 32 or below so the table stays readable.');

  const t = new Tracer();
  const dp = t.array('dp', new Array(n + 1).fill(0), 'dp — set bits in i', ['i']);
  t.setVars({ n });

  yield t.note(1, {
    note: 'Every number is the most recent power of two plus a smaller number already solved.',
  });

  let offset = 1;
  yield t.note(3, { vars: { offset }, note: 'offset tracks the highest power of two seen so far.' });

  for (let i = 1; i <= n; i++) {
    if (offset * 2 === i) {
      offset = i;
      yield t.note(5, {
        i,
        vars: { offset },
        note: `${i} is a power of two — it starts a new block.`,
      });
    }

    yield t.compare(6, {
      i,
      j: i - offset,
      vars: { i },
      note: `${i} is ${offset} + ${i - offset}, so it has one more set bit than ${i - offset}.`,
    });

    yield t.write(6, dp, i, 1 + dp.num(i - offset), {
      note: `dp[${i}] = 1 + dp[${i - offset}] = ${1 + dp.num(i - offset)}.`,
    });
  }

  yield t.settle(8, dp, dp.values.map((_, d) => d), {
    vars: { i: undefined, offset: undefined, result: dp.values.join(',') },
    note: `Set-bit counts for 0..${n}.`,
  });
}

export const countingBits: AlgorithmDef = {
  id: 'counting-bits',
  name: 'Counting Bits',
  category: 'Bit Manipulation',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '8' }],
  defaultInput: { n: 8 },
  run,
};
