import type {
  LLMProvider, LLMSettings,
  ReportGenerationInput, ReviewQuestionInput,
  ReviewFacilitatorInput, ConclusionQualityInput,
  FacilitatorAdvice,
} from './types';
import { LLMError, AuthError, RateLimitError, NetworkError, SchemaError } from './types';
import type { Entry, ClassifiableBullet, ConclusionQuality } from '../../lib/schema';
import {
  buildReflectionPrompt, buildReflectionQuestionsPrompt,
  buildWeekSummaryPrompt, buildProjectClassificationPrompt,
  buildReportGenerationPrompt, buildExperienceTitlePrompt,
  buildDailyReviewPrompt,
} from '../../lib/prompts';
import { buildQuestionerPrompt } from '../../features/coach/questionerPrompts';
import { buildFacilitatorPrompt, assessStepReadiness } from '../../features/coach/facilitatorPrompts';
import { assessConclusionQuality } from '../../features/conclusions/conclusionQuality';

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/** Remove <think>...</think> tags and other reasoning artifacts from LLM response */
function cleanResponse(content: string): string {
  // Remove <think>...</think> blocks
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '');
  // Remove <think>...</think> blocks (some models use different casing)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Trim whitespace
  return cleaned.trim();
}

async function callAPI(settings: LLMSettings, messages: Array<{ role: string; content: string }>): Promise<string> {
  const url = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const body = JSON.stringify({
    model: settings.model,
    messages,
    temperature: 0.2,
  });

  try {
    const response = await fetch(url, { method: 'POST', headers, body });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 401) throw new AuthError(text);
      if (response.status === 429) throw new RateLimitError(text);
      throw new LLMError(`API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as ChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new SchemaError('Invalid response structure');
    }
    return cleanResponse(content);
  } catch (err) {
    if (err instanceof LLMError) throw err;
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new NetworkError();
    }
    throw new LLMError(String(err));
  }
}

export function createOpenAICompatibleProvider(settings: LLMSettings): LLMProvider {
  return {
    async generateReflection(entry: Entry): Promise<string> {
      const prompt = buildReflectionPrompt(entry);
      return callAPI(settings, [
        { role: 'system', content: '你是一个工作日志复盘助手。直接输出复盘总结，不要包含任何思考过程、推理步骤或标签。' },
        { role: 'user', content: prompt },
      ]);
    },

    async generateDailyReview(entry: Entry): Promise<{ gap: string; reason: string; whatIf: string; lesson: string }> {
      const bullets = [
        ...entry.bullets.work.map((b) => ({ category: '工作', text: b.text })),
        ...entry.bullets.study.map((b) => ({ category: '学习', text: b.text })),
        ...entry.bullets.side.map((b) => ({ category: '副业', text: b.text })),
      ];
      const prompt = buildDailyReviewPrompt({
        date: entry.date,
        bullets,
        target: entry.review?.target,
      });
      const raw = await callAPI(settings, [
        { role: 'system', content: '你是一个每日复盘助手。只返回JSON，不要有其他内容。' },
        { role: 'user', content: prompt },
      ]);

      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        const parsed = JSON.parse(jsonMatch[0]) as { gap?: string; reason?: string; whatIf?: string; lesson?: string };
        return {
          gap: parsed.gap || '',
          reason: parsed.reason || '',
          whatIf: parsed.whatIf || '',
          lesson: parsed.lesson || '',
        };
      } catch {
        return { gap: '', reason: '', whatIf: '', lesson: '' };
      }
    },

    async generateReflectionQuestions(entry: Entry): Promise<string[]> {
      const prompt = buildReflectionQuestionsPrompt(entry);
      const raw = await callAPI(settings, [
        { role: 'system', content: '你是一个复盘引导助手。生成引导深度思考的问题，每行一个问题。直接返回问题，不要有其他内容。' },
        { role: 'user', content: prompt },
      ]);

      return raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && (line.includes('？') || line.includes('?')));
    },

    async generateWeekSummary(entries: Entry[], weekStart: string): Promise<string> {
      const prompt = buildWeekSummaryPrompt(entries, weekStart);
      return callAPI(settings, [
        { role: 'system', content: '你是一个工作日志周总结助手。直接输出总结内容，不要包含任何思考过程、推理步骤或标签。' },
        { role: 'user', content: prompt },
      ]);
    },

    async classifyProjects(bullets: ClassifiableBullet[]): Promise<Array<{ name: string; bulletIds: string[] }>> {
      const prompt = buildProjectClassificationPrompt(bullets);
      const raw = await callAPI(settings, [
        { role: 'system', content: '你是一个工作日志分类助手。直接返回JSON，不要包含任何思考过程、推理步骤或标签。' },
        { role: 'user', content: prompt },
      ]);

      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        const parsed = JSON.parse(jsonMatch[0]) as { projects: Array<{ name: string; bulletIds: string[] }> };
        if (!Array.isArray(parsed.projects)) throw new Error('Invalid projects array');
        return parsed.projects;
      } catch (err) {
        throw new SchemaError(`Failed to parse project classification: ${err}`);
      }
    },

    async generateReviewQuestions(input: ReviewQuestionInput): Promise<string[]> {
      const prompt = buildQuestionerPrompt(input);
      const raw = await callAPI(settings, [
        { role: 'system', content: '你是一个复盘设问人。生成推动思考深入的问题，每行一个问题。直接返回问题，不要有其他内容。' },
        { role: 'user', content: prompt },
      ]);

      return raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && (line.includes('？') || line.includes('?')));
    },

    async generateFacilitatorAdvice(input: ReviewFacilitatorInput): Promise<FacilitatorAdvice> {
      // Use local assessment first
      const localAdvice = assessStepReadiness(
        input.reviewCase,
        input.currentStep as any
      );

      // If we have API access, enhance with AI advice
      try {
        const prompt = buildFacilitatorPrompt({
          reviewCase: input.reviewCase,
          currentStep: input.currentStep as any,
          evidence: input.evidence.map((e) => ({
            entryId: '',
            date: e.date,
            category: 'work' as const,
            bulletId: '',
            text: e.text,
          })),
        });

        const raw = await callAPI(settings, [
          { role: 'system', content: '你是一个复盘引导人。评估当前步骤是否可以进入下一步。直接返回JSON，不要有其他内容。' },
          { role: 'user', content: prompt },
        ]);

        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as FacilitatorAdvice;
            return parsed;
          }
        } catch {
          // Fall back to local advice
        }
      } catch {
        // Fall back to local advice if API fails
      }

      return localAdvice;
    },

    async generateConclusionQualityAdvice(input: ConclusionQualityInput): Promise<ConclusionQuality> {
      // Use local assessment
      return assessConclusionQuality(input);
    },

    async generateExperienceTitles(
      items: Array<{ date: string; bullets: string[]; reflection?: string }>,
    ): Promise<Array<{ date: string; title: string }>> {
      if (items.length === 0) return [];
      const prompt = buildExperienceTitlePrompt(items);
      const raw = await callAPI(settings, [
        { role: 'system', content: '你是一个经历标题提炼助手。只返回JSON数组，不要有其他内容。' },
        { role: 'user', content: prompt },
      ]);

      try {
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('No JSON array found');
        const parsed = JSON.parse(jsonMatch[0]) as Array<{ date: string; title: string }>;
        if (!Array.isArray(parsed)) throw new Error('Not an array');
        return parsed.filter((item) => item?.date && item?.title);
      } catch {
        // Fallback: return empty so caller uses raw titles
        return [];
      }
    },

    async generateReport(input: ReportGenerationInput): Promise<string> {
      const prompt = buildReportGenerationPrompt(input);
      return callAPI(settings, [
        { role: 'system', content: '你是一个专业的报告撰写助手。直接输出报告内容（Markdown 格式），不要包含任何思考过程、推理步骤或标签。' },
        { role: 'user', content: prompt },
      ]);
    },
  };
}
