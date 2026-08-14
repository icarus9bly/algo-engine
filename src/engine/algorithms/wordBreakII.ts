import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function wordBreak(s, dict) {
  const res = [], current = [];
  function dfs(start) {
    if (start === s.length) { res.push(current.join(' ')); return; }
    for (const word of dict) {
      if (!s.startsWith(word, start)) continue;
      current.push(word);
      dfs(start + word.length);
      current.pop();
    }
  }
  dfs(0);
  return res;
}`;

function* dfs(
  t: Tracer,
  sArr: TracedArray,
  current: TracedArray,
  res: string[],
  s: string,
  dict: string[],
  start: number,
): Generator<AlgoEvent> {
  if (start === s.length) {
    res.push(current.values.join(' '));
    yield t.found(4, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { start, res: [...res] },
      note: `The sentence reaches the end of the string: "${current.values.join(' ')}".`,
    });
    return;
  }

  for (let w = 0; w < dict.length; w++) {
    const word = dict[w];
    const fits = s.startsWith(word, start);

    yield t.compare(6, {
      target: sArr,
      i: start,
      indices: fits ? Array.from({ length: word.length }, (_, d) => start + d) : [start],
      vars: { start, w, word },
      note: fits
        ? `"${word}" matches the string from index ${start}.`
        : `"${word}" does not match at index ${start} — the string reads "${s.slice(start, start + word.length)}" there.`,
    });

    if (!fits) continue;

    yield t.push(7, current, word, {
      vars: { start, w },
      note: `Use "${word}" and carry on from index ${start + word.length}.`,
    });
    yield* dfs(t, sArr, current, res, s, dict, start + word.length);
    yield t.pop(9, current, {
      vars: { start, w },
      note: `Every sentence using "${word}" at index ${start} is listed — take it back and try another word.`,
    });
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  const dict = ((input.dict as string[]) ?? []).map(String).filter(Boolean);
  if (s.length === 0) throw new Error('Give a non-empty string.');
  if (s.length > 12) throw new Error('Keep the string to 12 characters or fewer so the search stays watchable.');
  if (dict.length === 0) throw new Error('Give at least one dictionary word.');
  if (dict.length > 8) throw new Error('Keep the dictionary to 8 words or fewer.');

  const t = new Tracer();
  const sArr = t.array('s', [...s], 's', ['start']);
  t.array('dict', [...dict], 'dict — tried in order at every position', ['w']);
  const current = t.array('current', [], 'current sentence', []);

  yield t.note(1, {
    target: sArr,
    note: 'Every word that matches at the current position opens a branch; the rest of the string is then the same problem again.',
  });

  const res: string[] = [];
  yield* dfs(t, sArr, current, res, s, dict, 0);

  yield t.note(13, {
    target: sArr,
    vars: { start: undefined, w: undefined, word: undefined, res: [...res], result: res.length },
    note: res.length === 0
      ? 'No arrangement of dictionary words spells the whole string.'
      : `${res.length} sentence${res.length === 1 ? '' : 's'}: ${res.map((r) => `"${r}"`).join(', ')}.`,
  });
}

export const wordBreakII: AlgorithmDef = {
  id: 'word-break-ii',
  name: 'Word Break II',
  category: 'Backtracking',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'catsanddog' },
    { key: 'dict', label: 'dictionary', kind: 'words', placeholder: 'cat, cats, and, sand, dog' },
  ],
  defaultInput: { s: 'catsanddog', dict: ['cat', 'cats', 'and', 'sand', 'dog'] },
  run,
};
