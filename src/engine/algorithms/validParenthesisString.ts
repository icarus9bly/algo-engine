import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function checkValidString(s) {
  let lo = 0, hi = 0;
  for (const ch of s) {
    if (ch === '(') { lo++; hi++; }
    else if (ch === ')') { lo--; hi--; }
    else { lo--; hi++; }
    if (hi < 0) return false;
    lo = Math.max(lo, 0);
  }
  return lo === 0;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  if (!/^[()*]*$/.test(s)) throw new Error("s may only contain '(', ')' and '*'.");

  const t = new Tracer();
  const a = t.array('s', [...s], 's', ['i']);

  yield t.note(1, {
    note: "Rather than trying every meaning of '*', carry the range of open-bracket counts that are still possible.",
  });

  let lo = 0;
  let hi = 0;
  yield t.note(2, { vars: { lo, hi }, note: 'Nothing open yet, and no ambiguity.' });

  for (let i = 0; i < a.length; i++) {
    const ch = a.at(i) as string;

    if (ch === '(') {
      lo++;
      hi++;
      yield t.read(4, { i, vars: { i, lo, hi }, note: 'An opener raises both ends of the range.' });
    } else if (ch === ')') {
      lo--;
      hi--;
      yield t.read(5, { i, vars: { i, lo, hi }, note: 'A closer lowers both ends.' });
    } else {
      lo--;
      hi++;
      yield t.read(6, {
        i,
        vars: { i, lo, hi },
        note: "A star could be either, so the range widens in both directions.",
      });
    }

    if (hi < 0) {
      yield t.note(7, {
        i,
        vars: { result: false },
        note: 'Even treating every star as an opener leaves too many closers — invalid.',
      });
      return;
    }

    if (lo < 0) {
      lo = 0;
      yield t.note(8, {
        i,
        vars: { lo },
        note: 'The count cannot go below zero, so clamp the low end — those stars become openers or empty.',
      });
    }
  }

  const ok = lo === 0;
  yield t.note(10, {
    vars: { i: undefined, result: ok },
    note: ok
      ? 'Zero is inside the final range, so some reading of the stars balances.'
      : `Even with every star empty, ${lo} bracket${lo === 1 ? '' : 's'} stay open.`,
  });
}

export const validParenthesisString: AlgorithmDef = {
  id: 'valid-parenthesis-string',
  name: 'Valid Parenthesis String',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: '(*))' },
  ],
  defaultInput: { s: '(*))' },
  run,
};
