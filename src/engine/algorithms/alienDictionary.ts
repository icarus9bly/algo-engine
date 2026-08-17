import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function alienOrder(words) {
  const graph = new Map();
  for (const w of words) for (const ch of w) graph.set(ch, new Set());
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (a.length > b.length && a.startsWith(b)) return '';
    for (let j = 0; j < Math.min(a.length, b.length); j++) {
      if (a[j] !== b[j]) { graph.get(a[j]).add(b[j]); break; }
    }
  }
  const state = new Map(), out = [];
  for (const ch of graph.keys()) if (!dfs(ch)) return '';
  return out.reverse().join('');
}

function dfs(ch) {
  if (state.get(ch) === 'visiting') return false;
  if (state.get(ch) === 'done') return true;
  state.set(ch, 'visiting');
  for (const next of graph.get(ch)) if (!dfs(next)) return false;
  state.set(ch, 'done');
  out.push(ch);
  return true;
}`;

type State = 'new' | 'visiting' | 'done';

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const words = (input.words as string[]) ?? [];
  if (words.length === 0) throw new Error('Give at least one word.');

  const letters = [...new Set(words.join(''))].sort();
  if (letters.length > 12) throw new Error('Keep it to 12 distinct letters or fewer.');

  const t = new Tracer();
  const wordArr = t.array('words', [...words], 'words (already in alien order)', ['i']);
  const g = t.graph('order', 'letters — an arrow means "comes before"', true, 'circle', []);
  const indexOf = new Map<string, number>();
  for (const ch of letters) indexOf.set(ch, g.add(ch));

  yield t.note(1, {
    note: 'Adjacent words disagree at exactly one position, and that disagreement is one ordering rule.',
  });

  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i];
    const b = words[i + 1];
    yield t.read(5, {
      target: wordArr,
      i,
      j: i + 1,
      vars: { i },
      note: `Compare "${a}" with "${b}".`,
    });

    if (a.length > b.length && a.startsWith(b)) {
      yield t.note(6, {
        target: wordArr,
        i,
        j: i + 1,
        vars: { result: '' },
        note: `"${a}" cannot come before its own prefix "${b}" — the input is inconsistent.`,
      });
      return;
    }

    let found = false;
    for (let j = 0; j < Math.min(a.length, b.length); j++) {
      if (a[j] !== b[j]) {
        yield t.connect(8, g, indexOf.get(a[j])!, indexOf.get(b[j])!, {
          note: `First difference at position ${j}: '${a[j]}' must come before '${b[j]}'.`,
        });
        found = true;
        break;
      }
    }
    if (!found) {
      yield t.note(8, {
        target: wordArr,
        i,
        j: i + 1,
        note: 'One word is a prefix of the other, which is allowed and tells us nothing new.',
      });
    }
  }

  const state = new Map<string, State>();
  const out: string[] = [];
  let ok = true;

  function* dfs(ch: string): Generator<AlgoEvent, boolean> {
    const at = indexOf.get(ch)!;
    if (state.get(ch) === 'visiting') {
      yield t.compare(19, {
        target: g,
        i: at,
        note: `'${ch}' is already on the current path — the rules contradict each other.`,
      });
      return false;
    }
    if (state.get(ch) === 'done') {
      yield t.compare(20, { target: g, i: at, note: `'${ch}' is already placed.` });
      return true;
    }

    state.set(ch, 'visiting');
    yield t.read(21, { target: g, i: at, note: `Resolve everything that must follow '${ch}'.` });

    for (const nb of g.neighbours(at)) {
      const nextCh = String(g.value(nb));
      yield t.note(22, {
        target: g,
        i: at,
        j: nb,
        note: `'${ch}' comes before '${nextCh}'.`,
      });
      if (!(yield* dfs(nextCh))) return false;
    }

    state.set(ch, 'done');
    out.push(ch);
    yield t.settle(24, g, [at], {
      vars: { out: [...out] },
      note: `Nothing is left after '${ch}', so it goes at the back of what remains.`,
    });
    return true;
  }

  for (const ch of letters) {
    if (!(yield* dfs(ch))) {
      ok = false;
      break;
    }
  }

  const answer = ok ? [...out].reverse().join('') : '';
  yield t.note(16, {
    vars: { i: undefined, out: undefined, result: answer },
    note: ok
      ? `Reversing the finish order gives the alphabet: ${answer}`
      : 'The ordering rules contradict each other, so no alphabet exists.',
  });
}

export const alienDictionary: AlgorithmDef = {
  id: 'alien-dictionary',
  name: 'Alien Dictionary',
  category: 'Advanced Graphs',
  code,
  inputFields: [
    { key: 'words', label: 'words', kind: 'words', placeholder: 'wrt, wrf, er, ett, rftt' },
  ],
  defaultInput: { words: ['wrt', 'wrf', 'er', 'ett', 'rftt'] },
  run,
};
