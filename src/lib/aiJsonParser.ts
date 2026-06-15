import type { ZodSchema } from 'zod';

type Result<T> =
  | { success: true; data: T }
  | { success: false; raw: string; error: string };

function tryExtractCodeBlock(text: string): string | null {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return m?.[1]?.trim() ?? null;
}

function tryExtractObject(text: string): string | null {
  const m = text.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}

function tryExtractArray(text: string): string | null {
  const m = text.match(/\[[\s\S]*\]/);
  return m ? m[0] : null;
}

export function parseAIJSON<T>(raw: string, schema: ZodSchema<T>): Result<T> {
  const attempts: string[] = [];
  attempts.push(raw);
  const code = tryExtractCodeBlock(raw);
  if (code) attempts.push(code);
  const obj = tryExtractObject(raw);
  if (obj) attempts.push(obj);
  const arr = tryExtractArray(raw);
  if (arr) attempts.push(arr);

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      const validated = schema.safeParse(parsed);
      if (validated.success) {
        return { success: true, data: validated.data };
      }
    } catch {
      // continue
    }
  }
  return { success: false, raw, error: 'All parsing strategies failed' };
}
