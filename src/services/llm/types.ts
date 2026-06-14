import type {
  ClassifiableBullet, Entry, Settings,
  ReviewCase, ConclusionQuality,
} from '../../lib/schema';

export interface ReportGenerationInput {
  title: string;
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  entries: Array<{ date: string; bullets: string[] }>;
  goals: Array<{ title: string; status: string }>;
  reviewCases: Array<{ title: string; conclusions: string[] }>;
  principles: Array<{ title: string; content: string }>;
}

export interface ReviewQuestionInput {
  reviewCase: ReviewCase;
  currentStep: string;
  evidence: Array<{ date: string; text: string }>;
  whyChains: Array<{ id?: string; question: string; answer: string; depth: number }>;
}

export interface ReviewFacilitatorInput {
  reviewCase: ReviewCase;
  currentStep: string;
  evidence: Array<{ date: string; text: string }>;
}

export interface ConclusionQualityInput {
  content: string;
  whyChains: Array<{ id?: string; question: string; answer: string; depth: number }>;
  evidenceCount: number;
}

export interface FacilitatorAdvice {
  canProceed: boolean;
  missingFacts: string[];
  recommendedAction: string;
  warnings: string[];
}

export interface LLMProvider {
  generateReflection(entry: Entry): Promise<string>;
  generateDailyReview(entry: Entry): Promise<{ gap: string; reason: string; whatIf: string; lesson: string }>;
  generateReflectionQuestions(entry: Entry): Promise<string[]>;
  generateWeekSummary(entries: Entry[], weekStart: string): Promise<string>;
  classifyProjects(bullets: ClassifiableBullet[]): Promise<Array<{ name: string; bulletIds: string[] }>>;
  generateReviewQuestions(input: ReviewQuestionInput): Promise<string[]>;
  generateFacilitatorAdvice(input: ReviewFacilitatorInput): Promise<FacilitatorAdvice>;
  generateConclusionQualityAdvice(input: ConclusionQualityInput): Promise<ConclusionQuality>;
  generateReport(input: ReportGenerationInput): Promise<string>;
  generateExperienceTitles(
    items: Array<{ date: string; bullets: string[]; reflection?: string }>,
  ): Promise<Array<{ date: string; title: string }>>;
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
