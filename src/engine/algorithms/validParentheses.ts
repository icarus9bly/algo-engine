import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (!pairs[c]) stack.push(c);
    else if (stack.pop() !== pairs[c]) return false;
  }
  return stack.length === 0;
}`;

const PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');

  const t = new Tracer();
  const a = t.array('s', [...s], 's', ['i']);
  const stack = t.array('stack', [], 'stack', []);

  yield t.note(1, { note: 'A closing bracket must match the most recent unclosed opening one.' });
  yield t.note(3, { target: stack, note: 'The stack holds openings still waiting to be closed.' });

  for (let i = 0; i < a.length; i++) {
    const c = a.at(i) as string;
    yield t.read(5, { i, vars: { i, c }, note: `Read '${c}' at index ${i}.` });

    if (!PAIRS[c]) {
      yield t.push(6, stack, c, { note: `'${c}' opens — push it.` });
      continue;
    }

    if (stack.length === 0) {
      yield t.compare(7, {
        i,
        note: `'${c}' closes nothing — the stack is empty.`,
        vars: { result: false },
      });
      return;
    }

    const top = stack.at(stack.length - 1) as string;
    yield t.read(7, {
      target: stack,
      i: stack.length - 1,
      note: `'${c}' must close '${PAIRS[c]}'; the top of the stack is '${top}'.`,
    });

    if (top !== PAIRS[c]) {
      yield t.compare(7, { i, vars: { result: false }, note: `Mismatch — '${top}' cannot be closed by '${c}'.` });
      return;
    }

    yield t.pop(7, stack, { note: `Matched pair — pop '${top}'.` });
  }

  const ok = stack.length === 0;
  yield t.note(9, {
    target: stack,
    vars: { i: undefined, c: undefined, result: ok },
    note: ok
      ? 'Every bracket was closed in order.'
      : `${stack.length} opening bracket${stack.length === 1 ? '' : 's'} left unclosed.`,
  });
}

export const validParentheses: AlgorithmDef = {
  id: 'valid-parentheses',
  name: 'Valid Parentheses',
  category: 'Stack',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: '([{}])' },
  ],
  defaultInput: { s: '([{}])' },
  run,
};
