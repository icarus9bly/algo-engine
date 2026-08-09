import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function integerBreak(n) {
  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;
  for (let total = 2; total <= n; total++) {
    for (let part = 1; part < total; part++) {
      dp[total] = Math.max(dp[total],
                           part * Math.max(total - part, dp[total - part]));
    }
  }
  return dp[n];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  if (!Number.isInteger(n) || n < 2) throw new Error('n must be an integer of at least 2.');
  if (n > 20) throw new Error('Keep n at 20 or below so the table stays readable.');

  const t = new Tracer();
  const dp = t.array('dp', new Array(n + 1).fill(0), 'dp — best product for i', ['total']);

  yield t.note(1, {
    note: 'Split off one part, then either stop there or break the remainder further — whichever is larger.',
  });
  yield t.write(3, dp, 1, 1, { note: '1 cannot be broken, so it stands for itself.' });

  for (let total = 2; total <= n; total++) {
    yield t.read(4, { i: total, vars: { total }, note: `Best product from breaking ${total}?` });

    for (let part = 1; part < total; part++) {
      const rest = total - part;
      const keepWhole = rest;
      const breakMore = dp.num(rest);
      const candidate = part * Math.max(keepWhole, breakMore);
      yield t.compare(6, {
        i: rest,
        vars: { part, candidate },
        note: `${part} × ${rest} left over: keep it whole for ${part * keepWhole}, or break it for ${part * breakMore}.`,
      });
      if (candidate > dp.num(total)) {
        yield t.write(6, dp, total, candidate, {
          note: `Best so far for ${total}: ${candidate}.`,
        });
      }
    }
  }

  yield t.settle(9, dp, [n], {
    vars: { total: undefined, part: undefined, candidate: undefined, result: dp.num(n) },
    note: `Breaking ${n} gives a maximum product of ${dp.num(n)}.`,
  });
}

export const integerBreak: AlgorithmDef = {
  id: 'integer-break',
  name: 'Integer Break',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '10' }],
  defaultInput: { n: 10 },
  run,
};
