import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function encode(strs) {
  let res = '';
  for (const s of strs) res += s.length + '#' + s;
  return res;
}

function decode(s) {
  const res = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (s[j] !== '#') j++;
    const len = Number(s.slice(i, j));
    res.push(s.slice(j + 1, j + 1 + len));
    i = j + 1 + len;
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const strs = (input.strs as string[]) ?? [];

  const t = new Tracer();
  const source = t.array('strs', [...strs], 'strs', ['k']);
  const encoded = t.array('encoded', [], 'encoded', ['i', 'j']);

  yield t.note(1, {
    note: 'Length-prefixing each string makes the encoding unambiguous, whatever the contents.',
  });

  for (let k = 0; k < source.length; k++) {
    const s = String(source.at(k));
    const chunk = `${s.length}#${s}`;
    const added: number[] = [];
    for (const ch of chunk) added.push(encoded.pushCell(ch));
    yield t.emit('write', 3, {
      target: encoded,
      indices: added,
      vars: { k },
      note: `"${s}" becomes "${chunk}" — ${s.length} characters follow the #.`,
    });
  }

  yield t.note(4, {
    target: encoded,
    vars: { k: undefined, encoded: encoded.values.join('') },
    note: 'One flat string. Now decode it back without knowing the original split.',
  });

  const decoded = t.array('decoded', [], 'decoded', []);
  yield t.note(8, { target: decoded, note: 'Read it back one length-prefixed chunk at a time.' });

  let i = 0;
  while (i < encoded.length) {
    let j = i;
    yield t.read(11, { target: encoded, i, vars: { i, j }, note: `A chunk starts at ${i}.` });

    while (encoded.at(j) !== '#') {
      j++;
      yield t.read(12, {
        target: encoded,
        i: j,
        vars: { j },
        note: `Scan forward for the # — at ${j} so far.`,
      });
    }

    const len = Number(encoded.values.slice(i, j).join(''));
    yield t.compare(13, {
      target: encoded,
      indices: Array.from({ length: j - i }, (_, d) => i + d),
      vars: { len },
      note: `The prefix says the next ${len} characters are one string.`,
    });

    const word = encoded.values.slice(j + 1, j + 1 + len).join('');
    const at = decoded.pushCell(word);
    yield t.emit('write', 14, {
      target: decoded,
      i: at,
      note: `Recovered "${word}".`,
    });

    i = j + 1 + len;
    yield t.note(15, { target: encoded, vars: { i }, note: `Next chunk starts at ${i}.` });
  }

  yield t.settle(17, decoded, decoded.values.map((_, d) => d), {
    vars: { i: undefined, j: undefined, len: undefined },
    note: 'Decoded back to the original list.',
  });
}

export const encodeDecodeStrings: AlgorithmDef = {
  id: 'encode-decode-strings',
  name: 'Encode and Decode Strings',
  category: 'Arrays & Hashing',
  code,
  inputFields: [
    { key: 'strs', label: 'strs', kind: 'words', placeholder: 'neet, code, love, you' },
  ],
  defaultInput: { strs: ['neet', 'code', 'love', 'you'] },
  run,
};
