import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { syncBits, toBits } from './bits';

const WIDTH = 8;

const code = `function singleNumber(nums) {
  let res = 0;
  for (const n of nums) {
    res ^= n;
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  if (nums.some((v) => !Number.isInteger(v) || v < 0 || v > 255)) {
    throw new Error('Values must be integers between 0 and 255.');
  }

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['i']);
  const bits = t.array('res', toBits(0, WIDTH), 'res in binary', []);

  yield t.note(1, {
    note: 'XOR cancels a value against itself, so every pair vanishes and only the lone value survives.',
  });

  let res = 0;
  yield t.note(2, { vars: { res }, note: 'Start from 0, which is the XOR identity.' });

  for (let i = 0; i < a.length; i++) {
    const before = res;
    res ^= a.num(i);
    const changed = syncBits(bits, res, WIDTH);
    yield t.read(4, {
      i,
      vars: { i, res },
      note: `${before} XOR ${a.num(i)} = ${res}.`,
    });
    if (changed.length > 0) {
      yield t.emit('write', 4, {
        target: bits,
        indices: changed,
        note: `The bits ${a.num(i)} sets are flipped.`,
      });
    }
  }

  yield t.note(6, {
    vars: { i: undefined, result: res },
    note: `Everything paired off except ${res}.`,
  });
}

export const singleNumber: AlgorithmDef = {
  id: 'single-number',
  name: 'Single Number',
  category: 'Bit Manipulation',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '4, 1, 2, 1, 2' },
  ],
  defaultInput: { nums: [4, 1, 2, 1, 2] },
  run,
};
