import type { ClassifiableBullet, Entry, Settings } from '../../lib/schema';

export interface LLMProvider {
  generateReflection(entry: Entry): Promise<string>;
  generateWeekSummary(entries: Entry[], weekStart: string): Promise<string>;
  classifyProjects(bullets: ClassifiableBullet[]): Promise<Array<{ name: string; bulletIds: string[] }>>;
}

export type LLMSettings = Settings['llm'];

export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMError';
  }
}
export class AuthError extends LLMError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthError';
  }
}
export class RateLimitError extends LLMError {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}
export class NetworkError extends LLMError {
  constructor(message = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}
export class SchemaError extends LLMError {
  constructor(message = 'Invalid response format') {
    super(message);
    this.name = 'SchemaError';
  }
}
