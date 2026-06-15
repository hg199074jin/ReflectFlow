import { describe, it, expect } from 'vitest';
import { parseAIJSON } from './aiJsonParser';
import { z } from 'zod';

const schema = z.object({ foo: z.string() });

describe('parseAIJSON', () => {
  it('parses clean JSON', () => {
    const r = parseAIJSON('{"foo":"bar"}', schema);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.foo).toBe('bar');
  });

  it('extracts JSON from ```json code block', () => {
    const r = parseAIJSON('```json\n{"foo":"bar"}\n```', schema);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.foo).toBe('bar');
  });

  it('extracts first {...} substring', () => {
    const r = parseAIJSON('Some text {"foo":"bar"} more text', schema);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.foo).toBe('bar');
  });

  it('extracts first [...] substring for arrays', () => {
    const arrSchema = z.array(z.object({ x: z.number() }));
    const r = parseAIJSON('Here is the list [{"x":1}]', arrSchema);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual([{ x: 1 }]);
  });

  it('returns original text and error on total failure', () => {
    const r = parseAIJSON('not json at all', schema);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.raw).toBe('not json at all');
      expect(r.error).toBe('All parsing strategies failed');
    }
  });

  it('reports schema validation errors', () => {
    const r = parseAIJSON('{"foo":123}', schema);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.raw).toBe('{"foo":123}');
  });

  it('handles code block without language tag', () => {
    const r = parseAIJSON('```\n{"foo":"bar"}\n```', schema);
    expect(r.success).toBe(true);
  });

  it('handles nested objects in code block', () => {
    const nestedSchema = z.object({ a: z.object({ b: z.number() }) });
    const r = parseAIJSON('```json\n{"a":{"b":42}}\n```', nestedSchema);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.a.b).toBe(42);
  });

  it('prefers code block over loose object extraction', () => {
    const r = parseAIJSON('```json\n{"foo":"fromblock"}\n```\nalso {"foo":"fromtext"}', schema);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.foo).toBe('fromblock');
  });
});
