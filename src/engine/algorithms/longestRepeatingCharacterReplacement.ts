import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function characterReplacement(s, k) {
  const count = {};
  let l = 0, best = 0, maxf = 0;
  for (let r = 0; r < s.length; r++) {
    count[s[r]] = (count[s[r]] ?? 0) + 1;
    maxf = Math.max(maxf, count[s[r]]);
    while (r - l + 1 - maxf > k) {
      count[s[l]]--;
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}`;

function window(l: number, r: number): number[] {
  return Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  const k = input.k as number;

  const t = new Tracer();
  const a = t.array('s', [...s], 's');
  t.setVars({ k });

  yield t.note(1, {
    note: `A window is valid when everything except its most common character can be rewritten within ${k} changes.`,
  });

  const count: Record<string, number> = {};
  let l = 0;
  let best = 0;
  let maxf = 0;
  yield t.note(3, {
    vars: { l, best, maxf, count: {} },
    note: 'The window starts empty; maxf tracks its most common character.',
  });

  for (let r = 0; r < a.length; r++) {
    const ch = a.at(r) as string;
    count[ch] = (count[ch] ?? 0) + 1;
    yield t.read(5, {
      i: r,
      vars: { r, count: { ...count } },
      note: `Extend to '${ch}' — it now appears ${count[ch]}× in the window.`,
    });

    if (count[ch] > maxf) {
      maxf = count[ch];
      yield t.note(6, {
        indices: window(l, r),
        vars: { maxf },
        note: `The window's most common character now appears ${maxf}×.`,
      });
    }

    while (r - l + 1 - maxf > k) {
      yield t.compare(7, {
        indices: window(l, r),
        note: `${r - l + 1} − ${maxf} = ${r - l + 1 - maxf} rewrites needed, more than ${k}.`,
      });
      const gone = a.at(l) as string;
      count[gone]--;
      l++;
      yield t.note(9, {
        indices: window(l, r),
        vars: { l, count: { ...count } },
        note: `Drop '${gone}' and shrink from the left.`,
      });
    }

    const length = r - l + 1;
    if (length > best) {
      best = length;
      yield t.found(11, {
        indices: window(l, r),
        vars: { best },
        note: `Valid window of ${best}: "${a.values.slice(l, r + 1).join('')}".`,
      });
    } else {
      yield t.note(11, {
        indices: window(l, r),
        vars: { best },
        note: `This window is ${length} long, which does not beat ${best}.`,
      });
    }
  }

  yield t.note(13, {
    vars: { l: undefined, r: undefined, maxf: undefined, best },
    note: `Longest achievable run: ${best}.`,
  });
}

export const longestRepeatingCharacterReplacement: AlgorithmDef = {
  id: 'longest-repeating-character-replacement',
  name: 'Longest Repeating Character Replacement',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'AABABBA' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '1' },
  ],
  defaultInput: { s: 'AABABBA', k: 1 },
  run,
};
