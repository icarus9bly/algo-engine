import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function tribonacci(n) {
  const dp = [0, 1, 1];
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
  }
  return dp[n];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  if (!Number.isInteger(n) || n < 0) throw new Error('n must be a non-negative integer.');
  if (n > 25) throw new Error('Keep n at 25 or below so the table stays readable.');

  const t = new Tracer();
  const dp = t.array('dp', new Array(Math.max(n + 1, 3)).fill(0), 'dp', ['i']);
  t.setVars({ n });

  yield t.note(1, { note: 'Like Fibonacci, but each term sums the previous three.' });
  dp.set(1, 1);
  dp.set(2, 1);
  yield t.emit('write', 2, { indices: [0, 1, 2], note: 'The first three terms are given: 0, 1, 1.' });

  for (let i = 3; i <= n; i++) {
    const sum = dp.num(i - 1) + dp.num(i - 2) + dp.num(i - 3);
    yield t.compare(4, {
      indices: [i - 1, i - 2, i - 3],
      vars: { i },
      note: `${dp.num(i - 1)} + ${dp.num(i - 2)} + ${dp.num(i - 3)} = ${sum}.`,
    });
    yield t.write(4, dp, i, sum, { note: `dp[${i}] = ${sum}.` });
  }

  yield t.settle(6, dp, [n], {
    vars: { i: undefined, result: dp.num(n) },
    note: `T(${n}) = ${dp.num(n)}.`,
  });
}

export const tribonacci: AlgorithmDef = {
  id: 'tribonacci',
  name: 'N-th Tribonacci Number',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '10' }],
  defaultInput: { n: 10 },
  run,
};
