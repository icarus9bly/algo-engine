import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function canReach(s, minJump, maxJump) {
  const n = s.length;
  const dp = new Array(n).fill(false);
  dp[0] = true;
  let reachable = 0;
  for (let i = 1; i < n; i++) {
    if (i >= minJump && dp[i - minJump]) reachable++;
    if (i > maxJump && dp[i - maxJump - 1]) reachable--;
    dp[i] = reachable > 0 && s[i] === '0';
  }
  return dp[n - 1];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  const minJump = input.minJump as number;
  const maxJump = input.maxJump as number;
  if (!/^[01]+$/.test(s)) throw new Error('s must be a string of 0s and 1s.');
  if (s[0] !== '0') throw new Error('The first character must be 0.');
  if (minJump < 1 || maxJump < minJump) throw new Error('Need 1 ≤ minJump ≤ maxJump.');

  const t = new Tracer();
  const a = t.array('s', [...s], "s — '0' is standable", ['i']);
  const dp = t.array('dp', new Array(s.length).fill('F'), 'dp — reachable?', ['i']);
  t.setVars({ minJump, maxJump });

  yield t.note(1, {
    note: `A position is reachable if any position in the window [i−${maxJump}, i−${minJump}] is. Counting how many of those are reachable avoids re-scanning the window each step.`,
  });
  yield t.write(4, dp, 0, 'T', { note: 'Index 0 is where we start.' });

  let reachable = 0;
  yield t.note(5, { target: dp, vars: { reachable }, note: 'No landing spots in range yet.' });

  for (let i = 1; i < s.length; i++) {
    if (i >= minJump && dp.at(i - minJump) === 'T') {
      reachable++;
      yield t.note(7, {
        target: dp,
        i: i - minJump,
        vars: { i, reachable },
        note: `Index ${i - minJump} enters the jump window and is reachable.`,
      });
    }

    if (i > maxJump && dp.at(i - maxJump - 1) === 'T') {
      reachable--;
      yield t.note(8, {
        target: dp,
        i: i - maxJump - 1,
        vars: { reachable },
        note: `Index ${i - maxJump - 1} has fallen out of range.`,
      });
    }

    const ok = reachable > 0 && a.at(i) === '0';
    yield t.compare(9, {
      target: a,
      i,
      vars: { i },
      note: a.at(i) === '1'
        ? `Index ${i} holds a 1, so it cannot be stood on.`
        : reachable > 0
          ? `Index ${i} is free and ${reachable} reachable position${reachable === 1 ? '' : 's'} can jump here.`
          : `Index ${i} is free but nothing in range can reach it.`,
    });

    if (ok) yield t.write(9, dp, i, 'T', { note: `Index ${i} is reachable.` });
  }

  const result = dp.at(s.length - 1) === 'T';
  yield t.settle(11, dp, [s.length - 1], {
    vars: { i: undefined, reachable: undefined, result },
    note: result ? 'The last index can be reached.' : 'The last index cannot be reached.',
  });
}

export const jumpGameVII: AlgorithmDef = {
  id: 'jump-game-vii',
  name: 'Jump Game VII',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: '011010' },
    { key: 'minJump', label: 'minJump', kind: 'number', placeholder: '2' },
    { key: 'maxJump', label: 'maxJump', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { s: '011010', minJump: 2, maxJump: 3 },
  run,
};
