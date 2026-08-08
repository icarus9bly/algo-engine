import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function productExceptSelf(nums) {
  const res = new Array(nums.length).fill(1);
  let prefix = 1;
  for (let i = 0; i < nums.length; i++) {
    res[i] = prefix;
    prefix *= nums[i];
  }
  let postfix = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    res[i] *= postfix;
    postfix *= nums[i];
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');
  const res = t.array('res', new Array(nums.length).fill(1), 'res');

  yield t.note(1, {
    note: 'Every position gets the product of everything else — without division.',
  });
  yield t.note(2, { target: res, note: 'res starts as all 1s.' });

  let prefix = 1;
  yield t.note(3, { vars: { prefix }, note: 'prefix is the product of everything to the left.' });

  for (let i = 0; i < a.length; i++) {
    yield t.write(5, res, i, prefix, {
      vars: { i },
      note: `res[${i}] = product of everything left of it = ${prefix}.`,
    });
    prefix *= a.num(i);
    yield t.read(6, {
      i,
      vars: { prefix },
      note: `Fold nums[${i}] = ${a.num(i)} into prefix → ${prefix}.`,
    });
  }

  let postfix = 1;
  yield t.note(8, { vars: { postfix }, note: 'Now sweep back with the product of everything to the right.' });

  for (let i = a.length - 1; i >= 0; i--) {
    const updated = (res.num(i) as number) * postfix;
    yield t.write(10, res, i, updated, {
      vars: { i },
      note: `res[${i}] × postfix ${postfix} = ${updated}.`,
    });
    postfix *= a.num(i);
    yield t.read(11, {
      i,
      vars: { postfix },
      note: `Fold nums[${i}] = ${a.num(i)} into postfix → ${postfix}.`,
    });
  }

  yield t.settle(13, res, res.values.map((_, idx) => idx), {
    vars: { i: undefined, prefix: undefined, postfix: undefined },
    note: 'Each cell now holds left product × right product.',
  });
}

export const productExceptSelf: AlgorithmDef = {
  id: 'product-except-self',
  name: 'Product of Array Except Self',
  category: 'Arrays & Hashing',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 2, 3, 4' },
  ],
  defaultInput: { nums: [1, 2, 3, 4] },
  run,
};
