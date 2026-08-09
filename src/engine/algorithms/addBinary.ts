import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function addBinary(a, b) {
  let i = a.length - 1, j = b.length - 1;
  let carry = 0, res = '';
  while (i >= 0 || j >= 0 || carry) {
    const x = i >= 0 ? +a[i--] : 0;
    const y = j >= 0 ? +b[j--] : 0;
    const sum = x + y + carry;
    res = (sum % 2) + res;
    carry = sum > 1 ? 1 : 0;
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const a = String(input.a ?? '');
  const b = String(input.b ?? '');
  if (!/^[01]+$/.test(a) || !/^[01]+$/.test(b)) {
    throw new Error('Both inputs must be binary strings of 0s and 1s.');
  }

  const t = new Tracer();
  const aArr = t.array('a', [...a], 'a', ['i']);
  const bArr = t.array('b', [...b], 'b', ['j']);
  const out = t.array('res', [], 'res (built right to left)', []);

  yield t.note(1, {
    note: 'Column addition from the right, exactly like base 10 — only the carry threshold is 2 instead of 10.',
  });

  let i = aArr.length - 1;
  let j = bArr.length - 1;
  let carry = 0;
  const digits: string[] = [];
  yield t.note(3, { vars: { i, j, carry }, note: 'Start at the least significant end of both.' });

  while (i >= 0 || j >= 0 || carry) {
    const x = i >= 0 ? Number(aArr.at(i)) : 0;
    const y = j >= 0 ? Number(bArr.at(j)) : 0;
    yield t.read(5, {
      target: aArr,
      i: i >= 0 ? i : undefined,
      vars: { i, j },
      note: `Column values: ${x} from a, ${y} from b, plus a carry of ${carry}.`,
    });

    const sum = x + y + carry;
    digits.unshift(String(sum % 2));
    carry = sum > 1 ? 1 : 0;

    // res grows on the left, so rebuild it rather than appending.
    while (out.length > 0) out.popCell();
    for (const d of digits) out.pushCell(d);
    yield t.emit('write', 8, {
      target: out,
      i: 0,
      vars: { carry },
      note: `${x} + ${y} + carry = ${sum}, so write ${sum % 2} and carry ${carry}.`,
    });

    i--;
    j--;
  }

  yield t.settle(11, out, out.values.map((_, d) => d), {
    vars: { i: undefined, j: undefined, carry: undefined, result: digits.join('') },
    note: `${a} + ${b} = ${digits.join('')}.`,
  });
}

export const addBinary: AlgorithmDef = {
  id: 'add-binary',
  name: 'Add Binary',
  category: 'Bit Manipulation',
  code,
  inputFields: [
    { key: 'a', label: 'a', kind: 'text', placeholder: '1010' },
    { key: 'b', label: 'b', kind: 'text', placeholder: '1011' },
  ],
  defaultInput: { a: '1010', b: '1011' },
  run,
};
