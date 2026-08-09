import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { syncBits, toBits } from './bits';

const WIDTH = 16;

const code = `function rangeBitwiseAnd(left, right) {
  let shift = 0;
  while (left < right) {
    left >>= 1;
    right >>= 1;
    shift++;
  }
  return left << shift;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const left0 = input.left as number;
  const right0 = input.right as number;
  if (![left0, right0].every((v) => Number.isInteger(v) && v >= 0 && v <= 65535)) {
    throw new Error('left and right must be integers between 0 and 65535.');
  }
  if (left0 > right0) throw new Error('left must not exceed right.');

  const t = new Tracer();
  const lb = t.array('left', toBits(left0, WIDTH), 'left in binary', []);
  const rb = t.array('right', toBits(right0, WIDTH), 'right in binary', []);

  yield t.note(1, {
    note: 'Somewhere in the range every low bit flips to 0, so only the common leading prefix of left and right can survive.',
  });

  let left = left0;
  let right = right0;
  let shift = 0;
  yield t.note(2, { vars: { left, right, shift }, note: 'Shift both right until they agree.' });

  while (left < right) {
    left >>= 1;
    right >>= 1;
    shift++;
    const cl = syncBits(lb, left, WIDTH);
    const cr = syncBits(rb, right, WIDTH);
    yield t.emit('write', 4, {
      target: lb,
      indices: cl,
      vars: { left, shift },
      note: `Drop left's last bit: ${left}.`,
    });
    yield t.emit('write', 5, {
      target: rb,
      indices: cr,
      vars: { right },
      note: left === right
        ? `Drop right's too: ${right}. They now agree, so that is the common prefix.`
        : `Drop right's too: ${right}. Still different.`,
    });
  }

  const result = left << shift;
  syncBits(lb, result, WIDTH);
  yield t.emit('settle', 7, {
    target: lb,
    indices: lb.values.map((_, d) => d),
    vars: { result },
    note: `Shift the shared prefix back ${shift} place${shift === 1 ? '' : 's'}: ${result}.`,
  });
}

export const bitwiseAndOfRange: AlgorithmDef = {
  id: 'bitwise-and-of-range',
  name: 'Bitwise AND of Numbers Range',
  category: 'Bit Manipulation',
  code,
  inputFields: [
    { key: 'left', label: 'left', kind: 'number', placeholder: '5' },
    { key: 'right', label: 'right', kind: 'number', placeholder: '7' },
  ],
  defaultInput: { left: 5, right: 7 },
  run,
};
