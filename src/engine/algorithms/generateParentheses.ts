import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function generateParenthesis(n) {
  const res = [], current = [];
  function dfs(open, close) {
    if (current.length === 2 * n) { res.push(current.join('')); return; }
    if (open < n) {
      current.push('(');
      dfs(open + 1, close);
      current.pop();
    }
    if (close < open) {
      current.push(')');
      dfs(open, close + 1);
      current.pop();
    }
  }
  dfs(0, 0);
  return res;
}`;

function* dfs(
  t: Tracer,
  current: TracedArray,
  res: string[],
  n: number,
  open: number,
  close: number,
): Generator<AlgoEvent> {
  if (current.length === 2 * n) {
    res.push(current.values.join(''));
    yield t.found(4, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { open, close, res: [...res] },
      note: `All ${n} pairs are placed and every one closed: ${current.values.join('')}.`,
    });
    return;
  }

  if (open < n) {
    yield t.push(6, current, '(', {
      vars: { open, close },
      note: `${open} of ${n} opening brackets used, so another may be opened.`,
    });
    yield* dfs(t, current, res, n, open + 1, close);
    yield t.pop(8, current, {
      vars: { open, close },
      note: 'Undo that opening bracket and see what else this position allows.',
    });
  } else {
    yield t.note(5, {
      target: current,
      vars: { open, close },
      note: `All ${n} opening brackets are spent — nothing left to open.`,
    });
  }

  if (close < open) {
    yield t.push(11, current, ')', {
      vars: { open, close },
      note: `${open - close} bracket${open - close === 1 ? '' : 's'} still hanging open, so one can be closed here.`,
    });
    yield* dfs(t, current, res, n, open, close + 1);
    yield t.pop(13, current, {
      vars: { open, close },
      note: 'Undo that closing bracket; this branch is finished.',
    });
  } else {
    yield t.note(10, {
      target: current,
      vars: { open, close },
      note: 'Nothing is open, so a closing bracket here would be unmatched. That single rule is what makes every string valid by construction.',
    });
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = Number(input.n);
  if (!Number.isInteger(n) || n < 1) throw new Error('n must be a positive integer.');
  if (n > 5) throw new Error('Keep n at 5 or below so the search stays watchable.');

  const t = new Tracer();
  const current = t.array('current', [], 'current string', []);
  t.setVars({ n });

  yield t.note(1, {
    note: 'Nothing is ever checked for validity afterwards. A bracket is only placed when the counts already permit it.',
  });

  const res: string[] = [];
  yield* dfs(t, current, res, n, 0, 0);

  yield t.note(17, {
    target: current,
    vars: { open: undefined, close: undefined, res: [...res], result: res.length },
    note: `${res.length} well-formed string${res.length === 1 ? '' : 's'}: ${res.join(' ')}.`,
  });
}

export const generateParentheses: AlgorithmDef = {
  id: 'generate-parentheses',
  name: 'Generate Parentheses',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'n', label: 'pairs', kind: 'number', placeholder: '3' }],
  defaultInput: { n: 3 },
  run,
};
