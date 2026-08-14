import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function letterCombinations(digits) {
  const map = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl',
                6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
  const res = [], current = [];
  function dfs(i) {
    if (i === digits.length) { res.push(current.join('')); return; }
    for (const ch of map[digits[i]]) {
      current.push(ch);
      dfs(i + 1);
      current.pop();
    }
  }
  if (digits.length) dfs(0);
  return res;
}`;

const KEYPAD: Record<string, string> = {
  '2': 'abc',
  '3': 'def',
  '4': 'ghi',
  '5': 'jkl',
  '6': 'mno',
  '7': 'pqrs',
  '8': 'tuv',
  '9': 'wxyz',
};

function* dfs(
  t: Tracer,
  digitArr: TracedArray,
  current: TracedArray,
  res: string[],
  digits: string,
  i: number,
): Generator<AlgoEvent> {
  if (i === digits.length) {
    res.push(current.values.join(''));
    yield t.found(6, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { i, res: [...res] },
      note: `One letter taken from every digit: "${current.values.join('')}".`,
    });
    return;
  }

  const letters = KEYPAD[digits[i]];
  yield t.read(7, {
    target: digitArr,
    i,
    vars: { i, letters },
    note: `Digit ${digits[i]} offers ${letters.split('').join(', ')} — this position branches ${letters.length} ways.`,
  });

  for (const ch of letters) {
    yield t.push(8, current, ch, {
      vars: { i },
      note: `Take '${ch}' for position ${i}, then move to the next digit.`,
    });
    yield* dfs(t, digitArr, current, res, digits, i + 1);
    yield t.pop(10, current, {
      vars: { i },
      note: `Every word starting with '${ch}' here is listed — swap it for the next letter of ${digits[i]}.`,
    });
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const digits = String(input.digits ?? '').trim();
  if (digits.length > 4) throw new Error('Keep it to 4 digits or fewer so the search stays watchable.');
  if (digits && !/^[2-9]+$/.test(digits)) {
    throw new Error('Only the digits 2 through 9 carry letters.');
  }

  const t = new Tracer();
  const digitArr = t.array('digits', [...digits], 'digits — one keypad press each', ['i']);
  const current = t.array('current', [], 'current word', []);

  if (digits.length === 0) {
    yield t.note(13, {
      target: digitArr,
      vars: { res: [], result: 0 },
      note: 'No digits were pressed, so there is no word to build — not even the empty one.',
    });
    return;
  }

  const total = [...digits].reduce((acc, d) => acc * KEYPAD[d].length, 1);
  yield t.note(1, {
    target: digitArr,
    note: `Each digit picks exactly one of its letters, so there are ${[...digits].map((d) => KEYPAD[d].length).join(' × ')} = ${total} words to build.`,
  });

  const res: string[] = [];
  yield* dfs(t, digitArr, current, res, digits, 0);

  yield t.note(14, {
    target: digitArr,
    vars: { i: undefined, letters: undefined, res: [...res], result: res.length },
    note: `${res.length} word${res.length === 1 ? '' : 's'}: ${res.join(' ')}.`,
  });
}

export const letterCombinations: AlgorithmDef = {
  id: 'letter-combinations-of-a-phone-number',
  name: 'Letter Combinations of a Phone Number',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'digits', label: 'digits', kind: 'text', placeholder: '23' }],
  defaultInput: { digits: '23' },
  run,
};
