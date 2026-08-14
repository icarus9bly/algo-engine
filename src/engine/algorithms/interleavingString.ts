import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function isInterleave(s1, s2, s3) {
  if (s1.length + s2.length !== s3.length) return false;
  const dp = Array.from({ length: s1.length + 1 },
                       () => new Array(s2.length + 1).fill(false));
  dp[s1.length][s2.length] = true;
  for (let i = s1.length; i >= 0; i--) {
    for (let j = s2.length; j >= 0; j--) {
      if (i === s1.length && j === s2.length) continue;
      const k = i + j;
      const fromS1 = i < s1.length && s1[i] === s3[k] && dp[i + 1][j];
      const fromS2 = j < s2.length && s2[j] === s3[k] && dp[i][j + 1];
      dp[i][j] = fromS1 || fromS2;
    }
  }
  return dp[0][0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s1 = String(input.s1 ?? '');
  const s2 = String(input.s2 ?? '');
  const s3 = String(input.s3 ?? '');
  if ((s1.length + 1) * (s2.length + 1) > 64) {
    throw new Error('Keep s1 and s2 short enough that the table fits (about 7×7).');
  }

  const t = new Tracer();
  t.array('s1', [...s1], 's1', ['i']);
  t.array('s2', [...s2], 's2', ['j']);
  const s3Arr = t.array('s3', [...s3], 's3 — the string being built', ['k']);

  if (s1.length + s2.length !== s3.length) {
    yield t.note(2, {
      target: s3Arr,
      vars: { result: false },
      note: `s1 and s2 hold ${s1.length + s2.length} characters between them but s3 has ${s3.length} — no interleaving can line up.`,
    });
    return;
  }

  const dp = t.grid(
    'dp',
    Array.from({ length: s1.length + 1 }, () => new Array(s2.length + 1).fill('F')),
    'dp — can the tails of s1 and s2 still build the tail of s3?',
  );

  yield t.note(1, {
    target: s3Arr,
    note: 'Having taken i characters of s1 and j of s2, exactly i + j characters of s3 are spoken for — so one cell per (i, j) is enough.',
  });
  yield t.writeCell(5, dp, s1.length, s2.length, 'T', {
    vars: { i: s1.length, j: s2.length },
    note: 'Both tails are empty and so is the tail of s3 — trivially true, and every other answer leans on this one.',
  });

  for (let i = s1.length; i >= 0; i--) {
    for (let j = s2.length; j >= 0; j--) {
      if (i === s1.length && j === s2.length) continue;

      const k = i + j;
      yield t.read(9, {
        target: s3Arr,
        i: k,
        vars: { i, j, k },
        note: `${s1.length - i} of s1 and ${s2.length - j} of s2 are still to be placed, and s3 needs '${s3[k]}' next.`,
      });

      const fromS1 = i < s1.length && s1[i] === s3[k] && dp.value(i + 1, j) === 'T';
      const fromS2 = j < s2.length && s2[j] === s3[k] && dp.value(i, j + 1) === 'T';

      const reasons: string[] = [];
      if (fromS1) reasons.push(`take '${s1[i]}' from s1`);
      if (fromS2) reasons.push(`take '${s2[j]}' from s2`);

      yield t.writeCell(12, dp, i, j, fromS1 || fromS2 ? 'T' : 'F', {
        note: reasons.length
          ? `Can ${reasons.join(' or ')} and still finish — this cell is true.`
          : `Neither s1 nor s2 can supply '${s3[k]}' and leave a solvable rest — this cell is false.`,
      });
    }
  }

  const result = dp.value(0, 0) === 'T';
  yield t.settle(15, dp, [dp.at(0, 0)], {
    vars: { i: undefined, j: undefined, k: undefined, result },
    note: result
      ? `"${s1}" and "${s2}" can be interleaved to spell "${s3}".`
      : `"${s1}" and "${s2}" cannot be interleaved to spell "${s3}".`,
  });
}

export const interleavingString: AlgorithmDef = {
  id: 'interleaving-string',
  name: 'Interleaving String',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 's1', label: 's1', kind: 'text', placeholder: 'aabcc' },
    { key: 's2', label: 's2', kind: 'text', placeholder: 'dbbca' },
    { key: 's3', label: 's3', kind: 'text', placeholder: 'aadbbcbcac' },
  ],
  defaultInput: { s1: 'aabcc', s2: 'dbbca', s3: 'aadbbcbcac' },
  run,
};
