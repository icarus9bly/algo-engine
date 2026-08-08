import type { AlgoInput, InputField } from './types';

/** The raw, editable text behind each input field. */
export type RawInput = Record<string, string>;

export function serializeInput(fields: InputField[], input: AlgoInput): RawInput {
  const raw: RawInput = {};
  for (const f of fields) {
    const v = input[f.key];
    raw[f.key] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
  }
  return raw;
}

export interface ParseResult {
  input: AlgoInput | null;
  error: string | null;
}

export function parseInput(fields: InputField[], raw: RawInput): ParseResult {
  const input: AlgoInput = {};

  for (const f of fields) {
    const text = (raw[f.key] ?? '').trim();

    if (f.kind === 'numbers') {
      const parts = text.split(/[\s,]+/).filter(Boolean);
      const nums = parts.map(Number);
      if (nums.some(Number.isNaN)) {
        return { input: null, error: `${f.label}: expected a list of numbers.` };
      }
      if (nums.length > 40) {
        return { input: null, error: `${f.label}: keep it under 40 values.` };
      }
      input[f.key] = nums;
    } else if (f.kind === 'words') {
      const words = text.split(/[\s,]+/).filter(Boolean);
      if (words.length > 20) {
        return { input: null, error: `${f.label}: keep it under 20 words.` };
      }
      input[f.key] = words;
    } else if (f.kind === 'number') {
      const n = Number(text);
      if (text === '' || Number.isNaN(n)) {
        return { input: null, error: `${f.label}: expected a number.` };
      }
      input[f.key] = n;
    } else {
      if (text.length > 60) {
        return { input: null, error: `${f.label}: keep it under 60 characters.` };
      }
      input[f.key] = text;
    }
  }

  return { input, error: null };
}
