import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const LIMIT = 2147483647;

const code = `function reverse(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  let res = 0;
  while (x > 0) {
    const digit = x % 10;
    if (res > (2147483647 - digit) / 10) return 0;
    res = res * 10 + digit;
    x = Math.floor(x / 10);
  }
  return sign * res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const x = input.x as number;
  if (!Number.isInteger(x)) throw new Error('x must be an integer.');

  const t = new Tracer();
  const digits = t.array('x', [...String(Math.abs(x))], 'x, digit by digit', []);
  const out = t.array('res', [], 'res (digits pulled off the back of x)', []);

  const sign = x < 0 ? -1 : 1;
  yield t.note(1, {
    note: `Peel digits off the end of x and push them onto res. The sign is handled separately${sign < 0 ? ' — this one is negative' : ''}.`,
  });

  let n = Math.abs(x);
  let res = 0;
  yield t.note(4, { vars: { x: n, res, sign }, note: 'Nothing reversed yet.' });

  let pos = digits.length - 1;
  while (n > 0) {
    const digit = n % 10;
    yield t.read(6, {
      target: digits,
      i: pos,
      vars: { digit },
      note: `The last digit of ${n} is ${digit}.`,
    });

    // The overflow test has to happen before the multiply, not after it.
    if (res > (LIMIT - digit) / 10) {
      yield t.note(7, {
        target: out,
        vars: { result: 0 },
        note: `Another digit would push res past ${LIMIT}, so the reversal overflows a 32-bit int — return 0.`,
      });
      return;
    }

    res = res * 10 + digit;
    yield t.push(8, out, digit, {
      note: `res becomes ${res}.`,
    });

    n = Math.floor(n / 10);
    pos--;
    yield t.note(9, { vars: { x: n, res }, note: n > 0 ? `${n} left to peel.` : 'All digits consumed.' });
  }

  yield t.settle(11, out, out.values.map((_, d) => d), {
    vars: { digit: undefined, result: sign * res },
    note: `${x} reversed is ${sign * res}.`,
  });
}

export const reverseInteger: AlgorithmDef = {
  id: 'reverse-integer',
  name: 'Reverse Integer',
  category: 'Bit Manipulation',
  code,
  inputFields: [{ key: 'x', label: 'x', kind: 'number', placeholder: '123' }],
  defaultInput: { x: 123 },
  run,
};
