import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function minWindow(s, t) {
  const need = {}, window = {};
  for (const c of t) need[c] = (need[c] ?? 0) + 1;
  let have = 0, required = Object.keys(need).length;
  let best = [-1, -1], bestLen = Infinity, l = 0;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    window[c] = (window[c] ?? 0) + 1;
    if (need[c] && window[c] === need[c]) have++;
    while (have === required) {
      if (r - l + 1 < bestLen) { best = [l, r]; bestLen = r - l + 1; }
      window[s[l]]--;
      if (need[s[l]] && window[s[l]] < need[s[l]]) have--;
      l++;
    }
  }
  return bestLen === Infinity ? '' : s.slice(best[0], best[1] + 1);
}`;

function span(l: number, r: number): number[] {
  return Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  const tText = String(input.t ?? '');

  const tr = new Tracer();
  const sArr = tr.array('s', [...s], 's', ['l', 'r']);
  const tArr = tr.array('t', [...tText], 't', []);

  yield tr.note(1, { note: 'Smallest window of s containing every character of t, counts included.' });

  const need: Record<string, number> = {};
  for (const c of tText) need[c] = (need[c] ?? 0) + 1;
  const required = Object.keys(need).length;
  yield tr.note(3, {
    target: tArr,
    indices: tArr.values.map((_, d) => d),
    vars: { need: { ...need } },
    note: `${required} distinct character${required === 1 ? '' : 's'} must all be covered.`,
  });

  const win: Record<string, number> = {};
  let have = 0;
  let bestL = -1;
  let bestR = -1;
  let bestLen = Infinity;
  let l = 0;
  yield tr.note(5, { target: sArr, vars: { have, required, l, window: {} } });

  for (let r = 0; r < sArr.length; r++) {
    const c = sArr.at(r) as string;
    win[c] = (win[c] ?? 0) + 1;
    yield tr.read(8, {
      target: sArr,
      i: r,
      vars: { r, window: { ...win } },
      note: `Extend to '${c}'.`,
    });

    if (need[c] && win[c] === need[c]) {
      have++;
      yield tr.note(9, {
        target: sArr,
        indices: span(l, r),
        vars: { have },
        note: `'${c}' is now fully covered — ${have} of ${required}.`,
      });
    }

    while (have === required) {
      yield tr.compare(10, {
        target: sArr,
        indices: span(l, r),
        note: `Window ${l}..${r} covers everything — try to tighten it.`,
      });

      if (r - l + 1 < bestLen) {
        bestL = l;
        bestR = r;
        bestLen = r - l + 1;
        yield tr.found(11, {
          target: sArr,
          indices: span(l, r),
          vars: { best: sArr.values.slice(l, r + 1).join(''), bestLen },
          note: `Smallest so far: "${sArr.values.slice(l, r + 1).join('')}".`,
        });
      }

      const gone = sArr.at(l) as string;
      win[gone]--;
      if (need[gone] && win[gone] < need[gone]) have--;
      l++;
      yield tr.note(14, {
        target: sArr,
        indices: l <= r ? span(l, r) : [],
        vars: { l, have, window: { ...win } },
        note: `Drop '${gone}' from the left.`,
      });
    }
  }

  const answer = bestLen === Infinity ? '' : sArr.values.slice(bestL, bestR + 1).join('');
  yield tr.note(18, {
    target: sArr,
    indices: bestLen === Infinity ? [] : span(bestL, bestR),
    vars: { l: undefined, r: undefined, have: undefined, best: answer },
    note: answer === '' ? 'No window covers t.' : `Minimum window: "${answer}".`,
  });
}

export const minimumWindowSubstring: AlgorithmDef = {
  id: 'minimum-window-substring',
  name: 'Minimum Window Substring',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'ADOBECODEBANC' },
    { key: 't', label: 't', kind: 'text', placeholder: 'ABC' },
  ],
  defaultInput: { s: 'ADOBECODEBANC', t: 'ABC' },
  run,
};
