import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function predictPartyVictory(senate) {
  const R = [], D = [];
  for (let i = 0; i < senate.length; i++) {
    (senate[i] === 'R' ? R : D).push(i);
  }
  const n = senate.length;
  while (R.length > 0 && D.length > 0) {
    const r = R.shift(), d = D.shift();
    if (r < d) R.push(r + n);
    else D.push(d + n);
  }
  return R.length > 0 ? 'Radiant' : 'Dire';
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const senate = String(input.senate ?? '').toUpperCase();
  if (!/^[RD]+$/.test(senate)) throw new Error("senate must be a string of 'R' and 'D'.");
  if (senate.length > 12) throw new Error('Keep it to 12 senators or fewer.');

  const t = new Tracer();
  const a = t.array('senate', [...senate], 'senate', []);
  const R = t.array('R', [], 'Radiant queue (turn order)', []);
  const D = t.array('D', [], 'Dire queue (turn order)', []);

  yield t.note(1, {
    note: 'Each senator bans the next opponent to act, then goes to the back of the queue for the following round.',
  });

  const rq: number[] = [];
  const dq: number[] = [];
  for (let i = 0; i < senate.length; i++) {
    if (senate[i] === 'R') {
      rq.push(i);
      yield t.push(4, R, i, { note: `Senator ${i} is Radiant.` });
    } else {
      dq.push(i);
      yield t.push(4, D, i, { note: `Senator ${i} is Dire.` });
    }
  }

  const n = senate.length;
  while (rq.length > 0 && dq.length > 0) {
    const r = rq.shift()!;
    const d = dq.shift()!;
    yield t.compare(8, {
      target: a,
      i: r % n,
      j: d % n,
      note: `Radiant senator at turn ${r} versus Dire at turn ${d} — whoever acts first bans the other.`,
    });
    yield t.shift(8, R, { note: 'Radiant takes its turn.' });
    yield t.shift(8, D, { note: 'Dire takes its turn.' });

    if (r < d) {
      rq.push(r + n);
      yield t.push(9, R, r + n, { note: `Radiant acts first, bans that Dire senator, and requeues for round ${Math.floor((r + n) / n) + 1}.` });
    } else {
      dq.push(d + n);
      yield t.push(10, D, d + n, { note: `Dire acts first, bans that Radiant senator, and requeues.` });
    }
  }

  const winner = rq.length > 0 ? 'Radiant' : 'Dire';
  yield t.note(12, {
    target: rq.length > 0 ? R : D,
    vars: { result: winner },
    note: `Only ${winner} senators remain, so ${winner} wins.`,
  });
}

export const dota2Senate: AlgorithmDef = {
  id: 'dota2-senate',
  name: 'Dota2 Senate',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'senate', label: 'senate', kind: 'text', placeholder: 'RDD' },
  ],
  defaultInput: { senate: 'RDD' },
  run,
};
