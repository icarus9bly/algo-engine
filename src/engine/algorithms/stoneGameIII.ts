import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function stoneGameIII(stones) {
  const n = stones.length;
  const dp = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let take = 0;
    dp[i] = -Infinity;
    for (let k = 0; k < 3 && i + k < n; k++) {
      take += stones[i + k];
      dp[i] = Math.max(dp[i], take - dp[i + k + 1]);
    }
  }
  return dp[0] > 0 ? 'Alice' : dp[0] < 0 ? 'Bob' : 'Tie';
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const stones = input.stones as number[];
  if (stones.length === 0) throw new Error('Give at least one stone.');
  if (stones.length > 15) throw new Error('Keep it to 15 stones or fewer.');

  const t = new Tracer();
  const s = t.array('stones', stones, 'stones', ['i']);
  const n = s.length;
  const dp = t.array('dp', new Array(n + 1).fill(0), 'dp — lead for whoever moves at i', ['i']);

  yield t.note(1, {
    note: 'dp[i] is how far ahead the player to move can get. Subtracting the opponent’s best turns two players into one recurrence.',
  });

  for (let i = n - 1; i >= 0; i--) {
    yield t.read(4, { target: s, i, vars: { i }, note: `Whose turn starts at stone ${i}?` });

    let take = 0;
    let best = -Infinity;
    for (let k = 0; k < 3 && i + k < n; k++) {
      take += s.num(i + k);
      const score = take - dp.num(i + k + 1);
      yield t.compare(8, {
        target: s,
        indices: Array.from({ length: k + 1 }, (_, d) => i + d),
        vars: { taking: k + 1, take },
        note: `Taking ${k + 1} stone${k === 0 ? '' : 's'} scores ${take}, and leaves the opponent a lead of ${dp.num(i + k + 1)} — net ${score}.`,
      });
      if (score > best) best = score;
    }

    yield t.write(9, dp, i, best, {
      note: `Best net lead from position ${i}: ${best}.`,
    });
  }

  const lead = dp.num(0);
  const winner = lead > 0 ? 'Alice' : lead < 0 ? 'Bob' : 'Tie';
  yield t.settle(12, dp, [0], {
    vars: { i: undefined, taking: undefined, take: undefined, result: winner },
    note: lead === 0
      ? 'With both playing perfectly, neither can get ahead — a tie.'
      : `Alice moves first with a net lead of ${lead}, so ${winner} wins.`,
  });
}

export const stoneGameIII: AlgorithmDef = {
  id: 'stone-game-iii',
  name: 'Stone Game III',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'stones', label: 'stones', kind: 'numbers', placeholder: '1, 2, 3, 7' },
  ],
  defaultInput: { stones: [1, 2, 3, 7] },
  run,
};
