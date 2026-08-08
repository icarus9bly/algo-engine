import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { syncBits, toBits } from './bits';

const WIDTH = 8;

const code = `function missingNumber(nums) {
  let res = nums.length;
  for (let i = 0; i < nums.length; i++) {
    res ^= i ^ nums[i];
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
  const bits = t.array('res', toBits(nums.length, WIDTH), 'res in binary', []);

  yield t.note(1, {
    note: 'XOR every index and every value together: matched pairs cancel, leaving the missing one.',
  });

  let res = nums.length;
  yield t.note(2, { vars: { res }, note: `Seed with n = ${nums.length}, the one index with no slot.` });

  for (let i = 0; i < a.length; i++) {
    const before = res;
    res ^= i ^ a.num(i);
    const changed = syncBits(bits, res, WIDTH);
    yield t.emit('read', 4, {
      target: a,
      i,
      vars: { i, res },
      note: `${before} XOR ${i} XOR ${a.num(i)} = ${res}.`,
    });
    if (changed.length > 0) {
      yield t.emit('write', 4, {
        target: bits,
        indices: changed,
        note: `res is now ${res}.`,
      });
    }
  }

  yield t.note(6, {
    vars: { i: undefined, result: res },
    note: `Everything else cancelled — ${res} is missing.`,
  });
}

export const missingNumber: AlgorithmDef = {
  id: 'missing-number',
  name: 'Missing Number',
  category: 'Bit Manipulation',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '3, 0, 1' },
  ],
  defaultInput: { nums: [3, 0, 1] },
  run,
};
