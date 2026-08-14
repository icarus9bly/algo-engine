import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function partition(s) {
  const res = [], current = [];
  function dfs(start) {
    if (start === s.length) { res.push([...current]); return; }
    for (let end = start; end < s.length; end++) {
      const piece = s.slice(start, end + 1);
      if (!isPalindrome(piece)) continue;
      current.push(piece);
      dfs(end + 1);
      current.pop();
    }
  }
  dfs(0);
  return res;
}`;

const isPalindrome = (p: string) => p === [...p].reverse().join('');

function* dfs(
  t: Tracer,
  sArr: TracedArray,
  current: TracedArray,
  res: string[],
  s: string,
  start: number,
): Generator<AlgoEvent> {
  if (start === s.length) {
    res.push(`[${current.values.join('|')}]`);
    yield t.found(4, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { start, res: [...res] },
      note: `The whole string is used up and every piece is a palindrome: ${current.values.join(' | ')}.`,
    });
    return;
  }

  for (let end = start; end < s.length; end++) {
    const piece = s.slice(start, end + 1);
    const good = isPalindrome(piece);

    yield t.compare(7, {
      target: sArr,
      i: start,
      j: end,
      indices: Array.from({ length: end - start + 1 }, (_, d) => start + d),
      vars: { start, end, piece },
      note: `"${piece}" ${good ? 'reads the same backwards — it can be a piece' : 'is not a palindrome, so this cut is impossible'}.`,
    });

    if (!good) continue;

    yield t.push(8, current, piece, {
      vars: { start, end },
      note: `Cut "${piece}" off the front and partition what is left from index ${end + 1}.`,
    });
    yield* dfs(t, sArr, current, res, s, end + 1);
    yield t.pop(10, current, {
      vars: { start, end },
      note: `Every partition starting with "${piece}" is listed — put it back and try a longer first piece.`,
    });
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  if (s.length === 0) throw new Error('Give a non-empty string.');
  if (s.length > 8) throw new Error('Keep the string to 8 characters or fewer so the search stays watchable.');

  const t = new Tracer();
  const sArr = t.array('s', [...s], 's', ['start', 'end']);
  const current = t.array('current', [], 'current partition', []);

  yield t.note(1, {
    target: sArr,
    note: 'Each branch decides only where the first cut goes; the rest of the string is then the same problem again.',
  });

  const res: string[] = [];
  yield* dfs(t, sArr, current, res, s, 0);

  yield t.note(14, {
    target: sArr,
    vars: { start: undefined, end: undefined, piece: undefined, res: [...res], result: res.length },
    note: `${res.length} palindrome partition${res.length === 1 ? '' : 's'}: ${res.join(' ')}.`,
  });
}

export const palindromePartitioning: AlgorithmDef = {
  id: 'palindrome-partitioning',
  name: 'Palindrome Partitioning',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 's', label: 's', kind: 'text', placeholder: 'aab' }],
  defaultInput: { s: 'aab' },
  run,
};
