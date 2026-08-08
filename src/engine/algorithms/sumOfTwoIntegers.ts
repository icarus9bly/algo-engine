import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { syncBits, toBits } from './bits';

const WIDTH = 16;

const code = `function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
  }
  return a;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const a0 = input.a as number;
  const b0 = input.b as number;
  if (![a0, b0].every((v) => Number.isInteger(v) && v >= 0)) {
    throw new Error('a and b must be non-negative integers.');
  }
  if (a0 + b0 > 32767) throw new Error('Keep a + b under 32768 so it fits the 16-bit view.');

  const t = new Tracer();
  const bitsA = t.array('a', toBits(a0, WIDTH), 'a in binary', []);
  const bitsB = t.array('b', toBits(b0, WIDTH), 'b in binary', []);

  yield t.note(1, {
    note: 'XOR adds without carrying; AND finds where a carry is generated. Repeat until nothing carries.',
  });

  let a = a0;
  let b = b0;
  t.setVars({ a, b });

  while (b !== 0) {
    const carry = (a & b) << 1;
    yield t.compare(3, {
      target: bitsA,
      vars: { carry },
      note: `Both bits set in ${a} and ${b} carry left: carry = ${carry}.`,
    });

    a = a ^ b;
    const changedA = syncBits(bitsA, a, WIDTH);
    yield t.emit('write', 4, {
      target: bitsA,
      indices: changedA,
      vars: { a },
      note: `Add without carrying: a = ${a}.`,
    });

    b = carry;
    const changedB = syncBits(bitsB, b, WIDTH);
    yield t.emit('write', 5, {
      target: bitsB,
      indices: changedB,
      vars: { b },
      note: b === 0 ? 'Nothing left to carry.' : `b now holds the pending carry, ${b}.`,
    });
  }

  yield t.settle(7, bitsA, bitsA.values.map((_, d) => d), {
    vars: { carry: undefined, result: a },
    note: `${a0} + ${b0} = ${a}.`,
  });
}

export const sumOfTwoIntegers: AlgorithmDef = {
  id: 'sum-of-two-integers',
  name: 'Sum of Two Integers',
  category: 'Bit Manipulation',
  code,
  inputFields: [
    { key: 'a', label: 'a', kind: 'number', placeholder: '11' },
    { key: 'b', label: 'b', kind: 'number', placeholder: '5' },
  ],
  defaultInput: { a: 11, b: 5 },
  run,
};
